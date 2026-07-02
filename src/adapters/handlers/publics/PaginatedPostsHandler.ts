import { PaginationResponse, useTotalPages } from '../../../core/commons/hooks/ListPaginator';
import { PostResponse } from '../../../core/contracts/responses/PublicResponse';
import { Post } from '../../../core/domain/Post';
import { Dates } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
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
      SimpleLogger.warning(`Solicitud de movimientos paginados, sin los parámetros Page ó PerPage definidos, retornando -- 400 Bad Request`, 'PaginatedPostsHandler');
      return ResponseEntity.badRequest();
    }

    // calculamos la paginación;
    const offset = +page * +perPage;

    const postRepository = new PostRepository();
    const collection = await postRepository.findAllPaginatedByStatusComingOrActive(offset, +perPage);

    const response = {
      totalRows: await postRepository.count(),
      perPage: +perPage,
      page: +page,
    } as PaginationResponse<PostResponse>;

    if (!collection?.length) {
      SimpleLogger.warning(`No se encontraron subastas registradas.`, 'PaginatedPostsHandler');

      response.collection = new Array<PostResponse>();
      response.length = 0;
      response.totalPages = 0;
      response.hasPrevious = false;
      response.hasNext = false;

      return ResponseEntity.ok(response);
    }

    const collector = new Array<PostResponse>();

    let row: Post;
    for (row of collection) {
      const [featured] = row
        .attachments
        .filter((attachment: any) => attachment.default);

      collector.push({
        uid: row.uid,
        status: row.status,
        statusLabel: LABEL.parse(row.status),
        created: row.created,
        createdLabel: Dates.millisToLocalUserDatetime(row.created),
        startAt: row.file.startTime,
        startAtLabel: Dates.millisToLocalUserDatetime(row.file.startTime),
        endAt: row.file.endTime,
        endAtLabel: Dates.millisToLocalUserDatetime(row.file.endTime),
        attachment: featured.guid,
        title: row.attributes.title,
        price: row.attributes.amount,
      });
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


export const PaginatedPostsHandler = Middlify(PaginatedPosts, []);

