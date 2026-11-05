import { PaginationResponse, useTotalPages } from '../../../core/commons/hooks/ListPaginator';
import { BasePostResponse, FullPostResponse } from '../../../core/contracts/responses/PostResponse';
import { Post } from '../../../core/domain/Post';
import { Project } from '../../../core/domain/Project';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { Dates } from '../../../core/helpers/DatesHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { PostRepository } from '../../persistence/PostRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';

type PostWithProjectResponse = BasePostResponse & Pick<FullPostResponse, 'project'>;

const ReadPostsCollectionByUser: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      page, perPage,
    } = event.queryStringParameters;

    if (!page || !perPage) {
      SimpleLogger.warning(`Datos de paginación incorrectos, [400] Bad Request`, 'ReadPostCollectionHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const offset = +page * +perPage;

    const postRepository = new PostRepository();
    const collection = await postRepository.findAllPaginatedByUserIdAndStatusActive(event.principalUser.id, offset, +perPage);

    const response = {
      totalRows: await postRepository.countByUserIdAndStatusActive(event.principalUser.id),
      perPage: +perPage,
      page: +page,
    } as PaginationResponse<PostWithProjectResponse>;

    if (!collection?.length) {
      SimpleLogger.warning(`No se encontraron publicaciones.`, 'ReadPostCollectionHandler', event.requestId);

      response.collection = [];
      response.length = 0;
      response.totalPages = 0;
      response.hasPrevious = false;
      response.hasNext = false;

      return ResponseEntity.ok(response);
    }

    const collector = new Array<PostWithProjectResponse>();
    let post: Post;
    let postDTO: PostWithProjectResponse;

    const projectRepository = new ProjectRepository();
    const projects = new Map<number, Project>();

    for (post of collection) {
      let project = projects.get(post.projectId);
      if (!project) {
        project = await projectRepository.findByIdAndStatusNotDeleted(post.projectId);
        if (!project?.id) {
          SimpleLogger.warning(`El proyecto de la publicación con el ref: ${post.uid}, no encontrado.`, 'ReadPostCollectionByUserHandler', event.requestId);
          return ResponseEntity.notFound();
        }
        projects.set(post.projectId, project);
      }

      postDTO = {
        uid: post.uid,
        rawContent: post.markdownSource,
        htmlContent: post.htmlSource,
        created: post.createdAt,
        createdLabel: Dates.toUserDatetime(post.createdAt),
        updated: post.updatedAt,
        updatedLabel: Dates.toUserDatetime(post.updatedAt),
        totalChilds: post.postsCollection.length,
        project: {
          uid: project.uid,
          workspaceUid: project.workspace?.uid,
          name: project.name,
          key: project.projectKey,
          visibility: project.visibility,
          visibilityLabel: LABEL.parse(project.visibility),
          status: project.status,
          statusLabel: LABEL.parse(project.status),
          created: project.createdAt,
          createdLabel: Dates.millisToLocalUserDatetime(project.createdAt),
          updated: project.updatedAt,
          updatedLabel: Dates.millisToLocalUserDatetime(project.updatedAt),
        },
        displayName: post.author.displayName,
        mention: post.author.mention,
      } as PostWithProjectResponse;

      collector.push(postDTO);
    }

    response.collection = collector;
    response.length = collector.length;
    response.totalPages = useTotalPages(response.totalRows, response.perPage);
    response.hasPrevious = !!(response.page > 0);
    response.hasNext = !!(response.totalPages > (response.page + 1));

    return ResponseEntity.ok(response);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
};

export const ReadPostCollectionByUserHandler = Middlify(ReadPostsCollectionByUser, [
  ProvideLoggerMiddleware('ReadPostCollectionByUserHandler'),
  ProvidePolicyMiddleware(),
]);
