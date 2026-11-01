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
  try {
    const { ref } = event.queryStringParameters || {};
    if (typeof ref !== 'string' || !ref.trim()) {
      SimpleLogger.warning('No se recibió un UID válido para leer los bricks. [400] Bad Request', 'ReadInsightBricksCollectionHandler', event.requestId);
      return ResponseEntity.badRequest();
    }
    const insight = await new PostInsightRepository().findByUid(ref);
    if (!insight?.id || insight.status === GlobalStatus.Deleted) return ResponseEntity.notFound();
    const parent = await new PostRepository().findById(insight.parentId);
    if (!parent?.id || parent.status !== GlobalStatus.Active || parent.projectId !== insight.projectId
      || parent.workspaceId !== insight.workspaceId) return ResponseEntity.notFound();
    const project = await new ProjectRepository().findByIdAndStatusNotDeleted(insight.projectId);
    if (!project?.id || project.workspaceId !== insight.workspaceId) return ResponseEntity.notFound();
    const bricks = await new InsightBrickRepository().findByParentId(insight.id);
    const authors = bricks.length ? await new GlobalMentionRepository().findAllByIdIn([...new Set(bricks.map(row => row.authorId))]) : [];
    return ResponseEntity.ok(bricks.map(row => mapInsightResponse(row, authors.find(author => author.id === row.authorId), 'insight-brick')));
  }
  catch (error) { return ResponseEntity.error(error); }
};

export const ReadInsightBricksCollectionHandler = Middlify(ReadInsightBricksCollection, [
  ProvideLoggerMiddleware('ReadInsightBricksCollectionHandler'), ProvidePolicyMiddleware(),
]);
