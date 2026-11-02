import { Exception } from '../../../deepcore/application/core/Exception';
import { GlobalStatus } from '../../../core/commons/constants/GlobalConstants';
import { InsightResponse } from '../../../core/contracts/responses/InsightResponse';
import { Dates } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiProxyHandler } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { InsightBrickRepository } from '../../persistence/InsightBrickRepository';
import { PostInsightCommentRepository } from '../../persistence/PostInsightCommentRepository';
import { PostInsightRepository } from '../../persistence/PostInsightRepository';
import { PostRepository } from '../../persistence/PostRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { mapInsightResponse } from './InsightResponseMapper';

const ReadInsight: ApiProxyHandler = async event => {
  const handlerName = 'ReadInsightHandler';
  try {
    const { ref } = event.queryStringParameters || {};
    if (typeof ref !== 'string' || !ref.trim()) {
      SimpleLogger.warning('El UID de referencia es inválido. [400] Bad Request', 'ReadInsightHandler', event.requestId);
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
    const [comments, bricks] = await Promise.all([
      new PostInsightCommentRepository().findByParentId(insight.id),
      new InsightBrickRepository().findByParentId(insight.id),
    ]);
    const authorIds = [...new Set([insight.authorId, ...comments.map(row => row.authorId), ...bricks.map(row => row.authorId)])];
    const authors = await new GlobalMentionRepository().findAllByIdIn(authorIds);
    const author = (id: number) => authors.find(row => row.id === id);
    const response: InsightResponse = {
      ...mapInsightResponse(insight, author(insight.authorId), 'insight'),
      parentUid: parent.uid, totalComments: comments.length, totalBricks: bricks.length,
      comments: comments.map(row => mapInsightResponse(row, author(row.authorId), 'insight-comment')),
      bricks: bricks.map(row => mapInsightResponse(row, author(row.authorId), 'insight-brick')),
      project: {
        uid: project.uid, workspaceUid: project.workspace?.uid, name: project.name, key: project.projectKey,
        visibility: project.visibility, visibilityLabel: LABEL.parse(project.visibility),
        status: project.status, statusLabel: LABEL.parse(project.status),
        created: project.createdAt, createdLabel: Dates.millisToLocalUserDatetime(project.createdAt),
        updated: project.updatedAt, updatedLabel: Dates.millisToLocalUserDatetime(project.updatedAt),
      },
    };
    return ResponseEntity.ok(response);
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

export const ReadInsightHandler = Middlify(ReadInsight, [
  ProvideLoggerMiddleware('ReadInsightHandler'), ProvidePolicyMiddleware(),
]);
