import MarkdownIt from 'markdown-it';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { PostRepository } from '../../persistence/PostRepository';
import { PostInsightRepository } from '../../persistence/PostInsightRepository';
import { PostMapperService } from '../../../core/services/PostMapperService';
import { GlobalStatus, GlobalTaggableType } from '../../../core/commons/constants/GlobalConstants';
import { PostInsight } from '../../../core/domain/PostInsight';
import { Security } from '../../../deepcore/application/utils/Security';
import { TaggableService } from '../../../core/services/TaggableService';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
// import { ProjectRepository } from '../../persistence/ProjectRepository';
import { jsonString } from '../../../core/helpers/functions/Json';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { BasePostResponse } from '../../../core/contracts/responses/PostResponse';
import { Dates } from '../../../core/helpers/DatesHelper';


interface RequestBody {
  content: string;
  parentUid: string;
  workspaceUid: string;
  // projectUid: string;
}


const CreatePostInsight: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      parentUid, content, workspaceUid, /* projectUid, */
    } = event.body as RequestBody;

    if (!parentUid) {
      SimpleLogger.warning(`No se puede crear un Insight sin una publicación principal. [400] Bad Request`, 'CreatePostInsightHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!content) {
      SimpleLogger.warning(`Intento de creación de Insight vacío. [400] Bad Request`, 'CreatePostInsightHandler', event.requestId);
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

    const postRepository = new PostRepository();
    const parent = await postRepository.findByUid(parentUid);

    if (!parent?.id) {
      SimpleLogger.warning(`No se encontró la publicación principal con el UID: ${parentUid}. [404] Not Found`, 'CreatePostInsightHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const now = Date.now();
    const mdCompiler = MarkdownIt();
    const postMapperService = new PostMapperService();

    let htmlContent = mdCompiler.render(content);
    const postDataDTO = await postMapperService.parse(htmlContent, event.principalUser.id); // FIXME éste usuario debe venir del principalUser
    postDataDTO.postType = GlobalTaggableType.Insight;

    let entity = new PostInsight();
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

    const postInsightRepository = new PostInsightRepository();
    entity = await postInsightRepository.save(entity, true);

    const taggableService = new TaggableService();
    await taggableService.create(postDataDTO, entity.id);

    const insightDTO = {
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

    return ResponseEntity.ok(insightDTO);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}

export const CreatePostInsightHandler = Middlify(CreatePostInsight, [
  ProvideLoggerMiddleware('CreatePostInsightHandler'),
  ProvidePolicyMiddleware(),
])
