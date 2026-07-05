import MarkdownIt from 'markdown-it';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { PostRepository } from '../../persistence/PostRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { PostMapperService } from '../../../core/services/PostMapperService';
import { GlobalTaggableType } from '../../../core/commons/constants/GlobalConstants';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';
import { TaggableService } from '../../../core/services/TaggableService';


interface RequestBody {
  content: string;
  workspaceUid: string;
  projectUid: string;
  postUid: string;
}


const UpdatePost: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      content, workspaceUid, projectUid, postUid,
    } = event.body as RequestBody;

    if (!content) {
      SimpleLogger.warning(`No se recibió contenido para la publicación. [400] Bad Request`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!workspaceUid) {
      SimpleLogger.warning(`No se recibió un UID válido para WORKSPACE. [400] Bad Request`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!projectUid) {
      SimpleLogger.warning(`No se recibió un UID válido para PROJECT. [400] Bad Request`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!postUid) {
      SimpleLogger.warning(`No se recibió un UID válido para POST. [400] Bad Request`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    // if (!visibility || !useIsValidGlobalVisibilityType(visibility)) {
    //   SimpleLogger.warning(`No se recibió una VISIBILITY de proyecto válida.`, 'CreatePostHandler', event.requestId);
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

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findByUidAndStatusNotDeleted(projectUid);

    if (!project?.id) {
      SimpleLogger.warning(`No se encontró el PROJECT con el UID: ${projectUid} | workspace: ${workspaceUid}. [404] Not Found`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const postRepository = new PostRepository();

    let entity = await postRepository.findByUid(postUid);

    if (!entity?.id) {
      SimpleLogger.warning(`No se encontró el POST con el UID: ${postUid} | workspace: ${workspaceUid}. [404] Not Found`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const now = Date.now();
    const mdCompiler = MarkdownIt();
    const postMapperService = new PostMapperService();

    let htmlContent = mdCompiler.render(content);
    const postDataDTO = await postMapperService.parse(htmlContent, event.principalUser.id); // FIXME éste usuario debe venir del principalUser
    postDataDTO.postType = GlobalTaggableType.Post;

    entity.htmlSource = postDataDTO.post;
    entity.markdownSource = content;
    entity.updatedAt = now;

    entity = await postRepository.save(entity, true);

    const taggableService = new TaggableService();
    await taggableService.create(postDataDTO, entity.id);

    // TODO enviar aquí una notificación a los implicados;
    // TODO agregar un mapper aquí;

    return ResponseEntity.ok(entity);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const UpdatePostHandler = Middlify(UpdatePost, [
  ProvideLoggerMiddleware('UpdatePostHandler'),
  ProvidePolicyMiddleware(),
]);

