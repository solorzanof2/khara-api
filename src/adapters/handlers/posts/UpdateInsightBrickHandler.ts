import { BrickTimeService } from '../../../core/services/BrickTimeService';
import { GlobalStatus } from '../../../core/commons/constants/GlobalConstants';
import { BrickService } from '../../../core/services/BrickService';
import { PostReplyService } from '../../../core/services/PostReplyService';
import { ApiProxyHandler } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { InsightBrickRepository } from '../../persistence/InsightBrickRepository';
import { PostInsightRepository } from '../../persistence/PostInsightRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';
import { mapInsightResponse } from './InsightResponseMapper';

const updateBrick = (timeAction: boolean): ApiProxyHandler => async event => {
  try {
    const { content, replyUid, parentUid, workspaceUid } = event.body || {};
    if ((!timeAction && (typeof content !== 'string' || !content.trim()))
      || [replyUid, parentUid, workspaceUid].some(uid => typeof uid !== 'string' || !uid.trim())) return ResponseEntity.badRequest();
    const workspace = await new WorkspaceRepository().findByUidAndStatusNotDeleted(workspaceUid);
    if (!workspace?.id) return ResponseEntity.notFound();
    const author = await new GlobalMentionRepository().findByUserIdAndStatusActive(event.principalUser.id);
    if (!author?.id) return ResponseEntity.notFound();
    const parent = await new PostInsightRepository().findByUid(parentUid);
    if (!parent?.id || parent.status === GlobalStatus.Deleted || parent.workspaceId !== workspace.id) return ResponseEntity.notFound();
    const repository = new InsightBrickRepository();
    let entity = await repository.findByUid(replyUid);
    if (!entity?.id || entity.status === GlobalStatus.Deleted || entity.workspaceId !== workspace.id
      || entity.projectId !== parent.projectId || entity.parentId !== parent.id) return ResponseEntity.notFound();
    if (entity.userId !== event.principalUser.id) return ResponseEntity.forbidden();
    const project = await new ProjectRepository().findByIdAndStatusNotDeleted(parent.projectId);
    if (!project?.id || project.workspaceId !== workspace.id) return ResponseEntity.notFound();
    const previous = { attributes: entity.attributes, updatedAt: entity.updatedAt };
    const service = new BrickService();
    const prepared = timeAction ? await (async () => {
      const attributes = BrickTimeService.apply(BrickService.attributes(entity.attributes, entity.createdAt), event.body.action, Date.now(), event.body.measurementIndex, { startedAt: event.body.startedAt, finishedAt: event.body.finishedAt });
      return { category: entity.category || 'General', attributes,
        reply: await service.render(BrickService.description(entity), entity.category || 'General', attributes, project, event.principalUser.id) };
    })() : await service.prepare(content, event.body, project, event.principalUser.id, entity);
    entity.category = prepared.category;
    entity.attributes = JSON.stringify(prepared.attributes);
    entity.markdownSource = prepared.reply.markdown;
    entity.htmlSource = prepared.reply.data.post;
    entity.updatedAt = Math.max(Date.now(), previous.updatedAt + 1);
    if (!await repository.saveChanges(entity, previous)) return ResponseEntity.conflict('El brick cambió en otra sesión. Actualiza y vuelve a intentar.');
    await new PostReplyService().replaceReferences(prepared.reply, entity.id);
    return ResponseEntity.ok(mapInsightResponse(entity, author, 'insight-brick'));
  }
  catch (error) { return ResponseEntity.error(error); }
};

export const UpdateInsightBrickHandler = Middlify(updateBrick(false), [
  ProvideLoggerMiddleware('UpdateInsightBrickHandler'), ProvidePolicyMiddleware(),
]);

export const UpdateInsightBrickTimeHandler = Middlify(updateBrick(true), [
  ProvideLoggerMiddleware('UpdateInsightBrickTimeHandler'), ProvidePolicyMiddleware(),
]);
