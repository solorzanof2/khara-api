import { BrickService } from '../../../core/services/BrickService';
import { GlobalStatus } from '../../../core/commons/constants/GlobalConstants';
import { InsightBrick } from '../../../core/domain/InsightBrick';
import { InsightComment } from '../../../core/domain/InsightComment';
import { jsonString } from '../../../core/helpers/functions/Json';
import { PostReplyService } from '../../../core/services/PostReplyService';
import { ApiProxyHandler } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { Security } from '../../../deepcore/application/utils/Security';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { InsightBrickRepository } from '../../persistence/InsightBrickRepository';
import { PostInsightCommentRepository } from '../../persistence/PostInsightCommentRepository';
import { PostInsightRepository } from '../../persistence/PostInsightRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';
import { mapInsightResponse } from './InsightResponseMapper';

export function createInsightReplyHandler(type: 'insight-comment' | 'insight-brick'): ApiProxyHandler {
  const handler: ApiProxyHandler = async event => {
    try {
      const { content, parentUid, workspaceUid } = event.body || {};
      if (typeof content !== 'string' || !content.trim()
        || [parentUid, workspaceUid].some(uid => typeof uid !== 'string' || !uid.trim())) return ResponseEntity.badRequest();
      const workspace = await new WorkspaceRepository().findByUidAndStatusNotDeleted(workspaceUid);
      if (!workspace?.id) return ResponseEntity.notFound();
      const author = await new GlobalMentionRepository().findByUserIdAndStatusActive(event.principalUser.id);
      if (!author?.id) return ResponseEntity.notFound();
      const parent = await new PostInsightRepository().findByUid(parentUid);
      if (!parent?.id || parent.status === GlobalStatus.Deleted || parent.workspaceId !== workspace.id) return ResponseEntity.notFound();
      const project = await new ProjectRepository().findByIdAndStatusNotDeleted(parent.projectId);
      if (!project?.id || project.workspaceId !== workspace.id) return ResponseEntity.notFound();
      const service = new PostReplyService();
      const brick = type === 'insight-brick'
        ? await new BrickService().prepare(content, event.body, project, event.principalUser.id) : undefined;
      const reply = brick?.reply ?? await service.prepare(content, type, project, event.principalUser.id);
      const entity = type === 'insight-brick' ? new InsightBrick() : new InsightComment();
      Object.assign(entity, {
        uid: Security.getRandomGUID(), parentId: parent.id, workspaceId: workspace.id, projectId: project.id,
        authorId: author.id, userId: event.principalUser.id, createdAt: Date.now(), updatedAt: Date.now(),
        status: type === 'insight-brick' ? GlobalStatus.Pending : GlobalStatus.Active,
        markdownSource: reply.markdown, htmlSource: reply.data.post, attributes: jsonString(brick?.attributes ?? {}),
      });
      if (entity instanceof InsightBrick) entity.category = brick!.category;
      const saved = entity instanceof InsightBrick
        ? await new InsightBrickRepository().save(entity, true)
        : await new PostInsightCommentRepository().save(entity, true);
      await service.createReferences(reply, saved.id);
      return ResponseEntity.ok(mapInsightResponse(saved, author, type));
    }
    catch (error) { return ResponseEntity.error(error); }
  };
  return Middlify(handler, [
    ProvideLoggerMiddleware(type === 'insight-brick' ? 'CreateInsightBrickHandler' : 'CreateInsightCommentHandler'),
    ProvidePolicyMiddleware(),
  ]);
}
