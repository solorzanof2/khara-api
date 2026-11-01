import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { PostCommentRepository } from '../../persistence/PostCommentRepository';
import { PostReplyService } from '../../../core/services/PostReplyService';
import { GlobalStatus } from '../../../core/commons/constants/GlobalConstants';
import { PostComment } from '../../../core/domain/PostComment';
import { Security } from '../../../deepcore/application/utils/Security';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { PostRepository } from '../../persistence/PostRepository';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { jsonString } from '../../../core/helpers/functions/Json';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { BasePostResponse } from '../../../core/contracts/responses/PostResponse';
import { Dates } from '../../../core/helpers/DatesHelper';


interface RequestBody {
  content: string;
  parentUid: string;
  workspaceUid: string;
}


const CreatePostComment: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      parentUid, content, workspaceUid,
    } = event.body as RequestBody;

    if (!parentUid) {
      SimpleLogger.warning(`No se puede crear un comentario sin una publicación principal. [400] Bad Request`, 'CreatePostCommentHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (typeof content !== 'string' || !content.trim()) {
      SimpleLogger.warning(`Intento de creación de comentario vacío. [400] Bad Request`, 'CreatePostCommentHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!workspaceUid) {
      SimpleLogger.warning(`No se recibió un UID válido para WORKSPACE. [400] Bad Request`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const workspaceRepository = new WorkspaceRepository();
    const workspace = await workspaceRepository.findByUidAndStatusNotDeleted(workspaceUid);

    if (!workspace?.id) {
      SimpleLogger.warning(`No se encontró el WORKSPACE con el UID: ${workspaceUid}.`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const globalMentionRepository = new GlobalMentionRepository();
    const globalMention = await globalMentionRepository.findByUserIdAndStatusActive(event.principalUser.id);

    if (!globalMention?.id) {
      SimpleLogger.warning(`No se encontró el PRINCIPAL o GLOBAL MENTION para el usuario: ${event.principalUser.username}. [404] Not Found`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const postRepository = new PostRepository();
    const parent = await postRepository.findByUid(parentUid);

    if (!parent?.id || parent.status !== GlobalStatus.Active || parent.workspaceId !== workspace.id) {
      SimpleLogger.warning(`No se encontró la publicación principal con el UID: ${parentUid}. [404] Not Found`, 'CreatePostCommentHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const project = await new ProjectRepository().findByIdAndStatusNotDeleted(parent.projectId);
    if (!project?.id || project.workspaceId !== workspace.id) {
      return ResponseEntity.notFound();
    }

    const now = Date.now();
    const replyService = new PostReplyService();
    const reply = await replyService.prepare(content, 'comment', project, event.principalUser.id);

    let entity = new PostComment();
    entity.uid = Security.getRandomGUID();
    entity.status = GlobalStatus.Active;
    entity.htmlSource = reply.data.post;
    entity.markdownSource = reply.markdown;
    entity.createdAt = now;
    entity.updatedAt = now;
    entity.attributes = jsonString({});
    entity.workspaceId = workspace.id;
    entity.projectId = parent.projectId;
    entity.authorId = globalMention.id;
    entity.userId = event.principalUser.id;

    entity.parentId = parent.id;

    const postCommentRepository = new PostCommentRepository();
    entity = await postCommentRepository.save(entity, true);

    await replyService.createReferences(reply, entity.id);

    const commentDTO = {
      type: 'comment',
      totalComments: 0,
      totalInsights: 0,
      uid: entity.uid,
      rawContent: entity.markdownSource,
      htmlContent: entity.htmlSource,
      created: entity.createdAt,
      createdLabel: Dates.toUserDatetime(entity.createdAt),
      updated: entity.updatedAt,
      updatedLabel: Dates.toUserDatetime(entity.updatedAt),
      displayName: globalMention.displayName,
      mention: globalMention.mention,
    } as BasePostResponse;

    return ResponseEntity.ok(commentDTO);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}

export const CreatePostCommentHandler = Middlify(CreatePostComment, [
  ProvideLoggerMiddleware('CreatePostCommentHandler'),
  ProvidePolicyMiddleware(),
]);
