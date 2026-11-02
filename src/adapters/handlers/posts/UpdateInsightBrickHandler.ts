import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { Exception } from '../../../deepcore/application/core/Exception';
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
  const handlerName = timeAction ? 'UpdateInsightBrickTimeHandler' : 'UpdateInsightBrickHandler';
  try {
    const { content, replyUid, parentUid, workspaceUid } = event.body || {};
    if (!timeAction && (typeof content !== 'string' || !content.trim())) {
      SimpleLogger.warning('No se recibió contenido válido. [400] Bad Request', handlerName, event.requestId);
      return ResponseEntity.badRequest();
    }
    if (typeof replyUid !== 'string' || !replyUid.trim()) {
      SimpleLogger.warning('No se recibió un UID válido para replyUid. [400] Bad Request', handlerName, event.requestId);
      return ResponseEntity.badRequest();
    }
    if (typeof parentUid !== 'string' || !parentUid.trim()) {
      SimpleLogger.warning('No se recibió un UID válido para parentUid. [400] Bad Request', handlerName, event.requestId);
      return ResponseEntity.badRequest();
    }
    if (typeof workspaceUid !== 'string' || !workspaceUid.trim()) {
      SimpleLogger.warning('No se recibió un UID válido para workspaceUid. [400] Bad Request', handlerName, event.requestId);
      return ResponseEntity.badRequest();
    }
    const workspace = await new WorkspaceRepository().findByUidAndStatusNotDeleted(workspaceUid);
    if (!workspace?.id) {
      SimpleLogger.warning('No se encontró el WORKSPACE con UID: ' + workspaceUid + '. [404] Not Found', handlerName, event.requestId);
      return ResponseEntity.notFound();
    }
    const author = await new GlobalMentionRepository().findByUserIdAndStatusActive(event.principalUser.id);
    if (!author?.id) {
      SimpleLogger.warning('No se encontró el GLOBAL MENTION activo del usuario: ' + event.principalUser.id + '. [404] Not Found', handlerName, event.requestId);
      return ResponseEntity.notFound();
    }
    const parent = await new PostInsightRepository().findByUid(parentUid);
    if (!parent?.id || parent.status === GlobalStatus.Deleted || parent.workspaceId !== workspace.id) {
      SimpleLogger.warning('No se encontró el insight ' + parentUid + ' disponible en el workspace ' + workspaceUid + '. [404] Not Found', handlerName, event.requestId);
      return ResponseEntity.notFound();
    }
    const repository = new InsightBrickRepository();
    let entity = await repository.findByUid(replyUid);
    if (!entity?.id || entity.status === GlobalStatus.Deleted || entity.workspaceId !== workspace.id
      || entity.projectId !== parent.projectId || entity.parentId !== parent.id) {
      SimpleLogger.warning('No se encontró el brick ' + replyUid + ' disponible para el insight ' + parentUid + ', proyecto ' + parent.projectId + ' y workspace ' + workspaceUid + '. [404] Not Found', handlerName, event.requestId);
      return ResponseEntity.notFound();
    }
    if (entity.userId !== event.principalUser.id) {
      SimpleLogger.warning('El usuario ' + event.principalUser.id + ' no es autor de la respuesta ' + replyUid + '. [403] Forbidden', handlerName, event.requestId);
      return ResponseEntity.forbidden();
    }
    const project = await new ProjectRepository().findByIdAndStatusNotDeleted(parent.projectId);
    if (!project?.id || project.workspaceId !== workspace.id) {
      SimpleLogger.warning('No se encontró el proyecto ' + parent.projectId + ' en el workspace ' + workspaceUid + '. [404] Not Found', handlerName, event.requestId);
      return ResponseEntity.notFound();
    }
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
    if (!await repository.saveChanges(entity, previous)) {
      SimpleLogger.warning('El brick ' + replyUid + ' cambió en otra sesión; no se guardaron los cambios. [409] Conflict', handlerName, event.requestId);
      return ResponseEntity.conflict('El brick cambió en otra sesión. Actualiza y vuelve a intentar.');
    }
    await new PostReplyService().replaceReferences(prepared.reply, entity.id);
    return ResponseEntity.ok(mapInsightResponse(entity, author, 'insight-brick'));
  }
  catch (error) {
    if (error instanceof Exception && error.code >= 400 && error.code < 500) {
      SimpleLogger.warning('No se pudo actualizar el brick ' + event.body?.replyUid + '; acción: ' + (timeAction ? event.body?.action : 'editar') + '. ' + error.message + ' [' + error.code + ']', handlerName, event.requestId);
    }
    else {
      SimpleLogger.error('No se pudo actualizar el brick ' + event.body?.replyUid + '; acción: ' + (timeAction ? event.body?.action : 'editar') + '. ' + '[' + (error instanceof Exception ? error.code : 500) + '] ' + (error instanceof Error ? error.stack || error.message : String(error)), handlerName, event.requestId);
    }
    return ResponseEntity.error(error);
  }
};

export const UpdateInsightBrickHandler = Middlify(updateBrick(false), [
  ProvideLoggerMiddleware('UpdateInsightBrickHandler'), ProvidePolicyMiddleware(),
]);

export const UpdateInsightBrickTimeHandler = Middlify(updateBrick(true), [
  ProvideLoggerMiddleware('UpdateInsightBrickTimeHandler'), ProvidePolicyMiddleware(),
]);
