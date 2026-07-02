import { PaginationResponse, useTotalPages } from '../../../core/commons/hooks/ListPaginator';
import { BasePostResponse, /* FullPostResponse */ } from '../../../core/contracts/responses/PostResponse';
import { Post } from '../../../core/domain/Post';
// import { PostComment } from '../../../core/domain/PostComment';
// import { PostInsight } from '../../../core/domain/PostInsight';
import { Dates } from '../../../core/helpers/DatesHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { PostRepository } from '../../persistence/PostRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';


const ReadPostsCollection: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      page, perPage, ref,
    } = event.queryStringParameters;

    if (!page || !perPage) {
      SimpleLogger.warning(`Datos de paginación incorrectos, [400] Bad Request`, 'ReadPostCollectionHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!ref) {
      SimpleLogger.warning(`No se especificó un UID de referencia para leer las publicaciones. [400] Bad Request`, 'ReadPostCollectionHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findByUidAndStatusNotDeleted(ref);

    if (!project?.id) {
      SimpleLogger.warning(`No se encontró PROJECT con el UID: ${ref} o el mismo está eliminado.`, 'ReadPostCollectionHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const offset = +page * +perPage;

    const postRepository = new PostRepository();
    const collection = await postRepository.findAllPaginatedByProjectIdAndStatusActive(project.id, offset, +perPage);

    const response = {
      totalRows: await postRepository.countByProjectIdAndStatusActive(project.id),
      perPage: +perPage,
      page: +page,
    } as PaginationResponse<BasePostResponse>;

    if (!collection?.length) {
      SimpleLogger.warning(`No se encontraron publicaciones.`, 'ReadPostCollectionHandler', event.requestId);

      response.collection = [];
      response.length = 0;
      response.totalPages = 0;
      response.hasPrevious = false;
      response.hasNext = false;

      return ResponseEntity.ok(response);
    }

    const collector = new Array<BasePostResponse>();
    let post: Post;
    // let insight: PostInsight;
    // let comment: PostComment;
    let postDTO: BasePostResponse;
    // let insightDTO: any;
    // let commentDTO: any;

    for (post of collection) {
      postDTO = {
        uid: post.uid,
        rawContent: post.markdownSource,
        htmlContent: post.htmlSource,
        created: post.createdAt,
        createdLabel: Dates.toUserDatetime(post.createdAt),
        updated: post.updatedAt,
        updatedLabel: Dates.toUserDatetime(post.updatedAt),
        totalComments: post.comments.length,
        totalInsights: post.insights.length,
        displayName: post.author.displayName,
        mention: post.author.mention,
      } as BasePostResponse;

      // for (insight of post.insights) {
      //   insightDTO = {
      //     uid: insight.uid,
      //     rawContent: insight.markdownSource,
      //     htmlContent: insight.htmlSource,
      //     created: insight.createdAt,
      //     createdLabel: Dates.toUserDatetime(insight.createdAt),
      //     updated: insight.updatedAt,
      //     updatedLabel: Dates.toUserDatetime(insight.updatedAt),
      //   }

      //   postDTO.insights.push(insightDTO);
      // }

      // for (comment of post.comments) {
      //   commentDTO = {
      //     uid: comment.uid,
      //     rawContent: comment.markdownSource,
      //     htmlContent: comment.htmlSource,
      //     created: comment.createdAt,
      //     createdLabel: Dates.toUserDatetime(comment.createdAt),
      //     updated: comment.updatedAt,
      //     updatedLabel: Dates.toUserDatetime(comment.updatedAt),
      //   }

      //   postDTO.comments.push(commentDTO);
      // }

      collector.push(postDTO);
    }

    // armamos la info de paginación;

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
}


export const ReadPostsCollectionHandler = Middlify(ReadPostsCollection, [
  ProvideLoggerMiddleware('ReadPostCollectionHandler'),
  ProvidePolicyMiddleware(),
]);

