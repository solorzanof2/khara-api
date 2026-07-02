import MarkdownIt from 'markdown-it';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
// import { PostRepository } from '../../persistence/PostRepository';
import { PostInsightCommentRepository } from '../../persistence/PostInsightCommentRepository';
import { PostMapperService } from '../../../core/services/PostMapperService';
import { GlobalStatus, GlobalTaggableType } from '../../../core/commons/constants/GlobalConstants';
import { InsightComment } from '../../../core/domain/InsightComment';
import { Security } from '../../../deepcore/application/utils/Security';
import { TaggableService } from '../../../core/services/TaggableService';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
// import { ProjectRepository } from '../../persistence/ProjectRepository';
import { jsonString } from '../../../core/helpers/functions/Json';
import { PostInsightRepository } from '../../persistence/PostInsightRepository';
import { Dates } from '../../../core/helpers/DatesHelper';
import { BasePostResponse } from '../../../core/contracts/responses/PostResponse';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';


interface RequestBody {
  content: string;
  parentUid: string;
  workspaceUid: string;
  // projectUid: string;
}


const CreateInsightComment: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      parentUid, content, workspaceUid, /* projectUid, */
    } = event.body as RequestBody;

    if (!parentUid) {
      SimpleLogger.warning(`No se puede crear un comentario sin una publicación principal. [400] Bad Request`, 'CreatePostCommentHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!content) {
      SimpleLogger.warning(`Intento de creación de comentario vacío. [400] Bad Request`, 'CreatePostCommentHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!workspaceUid) {
      SimpleLogger.warning(`No se recibió un UID válido para WORKSPACE. [400] Bad Request`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    // if (!projectUid) {
    //   SimpleLogger.warning(`No se recibió un UID válido para PROJECT. [400] Bad Request`, 'CreatePostHandler', event.requestId);
    //   return ResponseEntity.badRequest();
    // }

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

    // const projectRepository = new ProjectRepository();
    // const project = await projectRepository.findByUidAndStatusNotDeleted(projectUid);

    // if (!project?.id) {
    //   SimpleLogger.warning(`No se encontró el PROJECT con el UID: ${projectUid} | workspace: ${workspaceUid}. [404] Not Found`, 'CreatePostHandler', event.requestId);
    //   return ResponseEntity.notFound();
    // }

    // const postRepository = new PostRepository();
    // const parent = await postRepository.findByUid(parentId);

    // if (!parent?.id) {
    //   SimpleLogger.warning(`No se encontró la publicación principal con el UID: ${parentId}. [404] Not Found`, 'CreatePostCommentHandler', event.requestId);
    //   return ResponseEntity.notFound();
    // }
    const insightRepository = new PostInsightRepository();
    const parent = await insightRepository.findByUid(parentUid);

    const now = Date.now();
    const mdCompiler = MarkdownIt();
    const postMapperService = new PostMapperService();

    let htmlContent = mdCompiler.render(content);
    const postDataDTO = await postMapperService.parse(htmlContent, event.principalUser.id); // FIXME éste usuario debe venir del principalUser
    postDataDTO.postType = GlobalTaggableType.InsightComment;

    let entity = new InsightComment();
    entity.uid = Security.getRandomGUID();
    entity.status = GlobalStatus.Active;
    entity.htmlSource = postDataDTO.post;
    entity.markdownSource = content;
    entity.createdAt = now;
    entity.updatedAt = now;
    entity.attributes = jsonString({});
    entity.workspaceId = workspace.id;
    // entity.projectId = project.id;
    entity.projectId = parent.projectId;
    entity.authorId = globalMention.id;
    entity.userId = event.principalUser.id;
    entity.parentId = parent.id;

    const postInsightCommentRepository = new PostInsightCommentRepository();
    entity = await postInsightCommentRepository.save(entity, true);

    const taggableService = new TaggableService();
    await taggableService.create(postDataDTO, entity.id);

    const commentDTO = {
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

export const CreateInsightCommentHandler = Middlify(CreateInsightComment, [
  ProvideLoggerMiddleware('CreateInsightCommentHandler'),
  ProvidePolicyMiddleware(),
]);
