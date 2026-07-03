import { PaginationResponse, useTotalPages } from '../../../core/commons/hooks/ListPaginator';
import { BasePostResponse } from '../../../core/contracts/responses/PostResponse';
import { Post } from '../../../core/domain/Post';
import { Dates } from '../../../core/helpers/DatesHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { PostRepository } from '../../persistence/PostRepository';


const PaginatedPosts: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      page, perPage,
    } = event.queryStringParameters;

    if (!page || !perPage) {
      SimpleLogger.warning(`Solicitud de posts paginados sin los parámetros Page ó PerPage definidos, retornando -- 400 Bad Request`, 'PaginatedPostsHandler');
      return ResponseEntity.badRequest();
    }

    const offset = +page * +perPage;

    const postRepository = new PostRepository();
    const collection = await postRepository.findAllPaginated(offset, +perPage);

    const response = {
      totalRows: await postRepository.count(),
      perPage: +perPage,
      page: +page,
    } as PaginationResponse<BasePostResponse>;

    if (!collection?.length) {
      SimpleLogger.warning(`No se encontraron publicaciones registradas.`, 'PaginatedPostsHandler');

      response.collection = [];
      response.length = 0;
      response.totalPages = 0;
      response.hasPrevious = false;
      response.hasNext = false;

      return ResponseEntity.ok(response);
    }

    const collector = new Array<BasePostResponse>();

    let row: Post;
    for (row of collection) {
      collector.push({
        uid: row.uid,
        rawContent: row.markdownSource,
        htmlContent: row.htmlSource,
        created: row.createdAt,
        createdLabel: Dates.toUserDatetime(row.createdAt),
        updated: row.updatedAt,
        updatedLabel: Dates.toUserDatetime(row.updatedAt),
        displayName: row.author.displayName,
        mention: row.author.mention,
      } as BasePostResponse);
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
}


export const PaginatedPostsHandler = Middlify(PaginatedPosts, []);