import { Exception } from '../../../deepcore/application/core/Exception';
import { GlobalStatus } from '../../../core/commons/constants/GlobalConstants';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiProxyHandler } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { InsightBrickRepository } from '../../persistence/InsightBrickRepository';
import { PostInsightRepository } from '../../persistence/PostInsightRepository';
import { PostRepository } from '../../persistence/PostRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { mapInsightResponse } from './InsightResponseMapper';

const ReadInsightBricksCollection: ApiProxyHandler = async event => {
  const handlerName = 'ReadInsightBricksCollectionHandler';
  try {
    const { ref } = event.queryStringParameters || {};
    if (typeof ref !== 'string' || !ref.trim()) {
      SimpleLogger.warning('No se recibió un UID válido para leer los bricks. [400] Bad Request', 'ReadInsightBricksCollectionHandler', event.requestId);
      return ResponseEntity.badRequest();
    }
    const insight = await new PostInsightRepository().findByUid(ref);
    if (!insight?.id || insight.status === GlobalStatus.Deleted) {
      SimpleLogger.warning('No se encontró el insight disponible con UID: ' + ref + '. [404] Not Found', handlerName, event.requestId);
      return ResponseEntity.notFound();
    }
    const parent = await new PostRepository().findById(insight.parentId);
    if (!parent?.id || parent.status !== GlobalStatus.Active || parent.projectId !== insight.projectId
      || parent.workspaceId !== insight.workspaceId) {
      SimpleLogger.warning('No se encontró la publicación principal ' + insight.parentId + ' activa en el proyecto ' + insight.projectId + ' y workspace ' + insight.workspaceId + ' del insight ' + ref + '. [404] Not Found', handlerName, event.requestId);
      return ResponseEntity.notFound();
    }
    const project = await new ProjectRepository().findByIdAndStatusNotDeleted(insight.projectId);
    if (!project?.id || project.workspaceId !== insight.workspaceId) {
      SimpleLogger.warning('No se encontró el proyecto ' + insight.projectId + ' en el workspace ' + insight.workspaceId + ' del insight ' + ref + '. [404] Not Found', handlerName, event.requestId);
      return ResponseEntity.notFound();
    }
    const bricks = await new InsightBrickRepository().findByParentId(insight.id);
    const authors = bricks.length ? await new GlobalMentionRepository().findAllByIdIn([...new Set(bricks.map(row => row.authorId))]) : [];
    return ResponseEntity.ok(bricks.map(row => mapInsightResponse(row, authors.find(author => author.id === row.authorId), 'insight-brick')));
  }
  catch (error) {
    if (error instanceof Exception && error.code >= 400 && error.code < 500) {
      SimpleLogger.warning('No se pudo completar la solicitud. ' + error.message + ' [' + error.code + ']', handlerName, event.requestId);
    }
    else {
      SimpleLogger.error('No se pudo completar la solicitud. ' + '[' + (error instanceof Exception ? error.code : 500) + '] ' + (error instanceof Error ? error.stack || error.message : String(error)), handlerName, event.requestId);
    }
    return ResponseEntity.error(error);
  }
};

export const ReadInsightBricksCollectionHandler = Middlify(ReadInsightBricksCollection, [
  ProvideLoggerMiddleware('ReadInsightBricksCollectionHandler'), ProvidePolicyMiddleware(),
]);
