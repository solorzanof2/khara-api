import { PaginationResponse, useTotalPages } from '../../../core/commons/hooks/ListPaginator';
import { ProjectResponse } from '../../../core/contracts/responses/ProjectResponse';
import { Project } from '../../../core/domain/Project';
import { Dates } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';


const ReadProjectsCollection: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      page, perPage, ref,
    } = event.queryStringParameters;

    if (!page || !perPage) {
      SimpleLogger.warning(`Datos de paginación incorrectos, [400] Bad Request`, 'ReadProjectsCollectionHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!ref) {
      SimpleLogger.warning(`No se recibió la referencia del workspace para leer los projectos.`, `ReadProjectsCollectionHandler`, event.requestId);
      return ResponseEntity.badRequest();
    }

    const workspaceRepository = new WorkspaceRepository();
    const workspace = await workspaceRepository.findByUid(ref);

    if (!workspace?.id) {
      SimpleLogger.warning(`No se encontró el workspace con la referencia: ${ref}, [404] Not Found`, `ReadProjectsCollectionHandler`, event.requestId);
      return ResponseEntity.notFound();
    }

    const offset = +page * +perPage;

    const projectRepository = new ProjectRepository();
    const collection = await projectRepository.findAllPaginatedByWorkspaceIdAndStatusNotDeleted(workspace.id, offset, +perPage);

    const response = {
      totalRows: await projectRepository.countByWorkspaceIdAndStatusActive(workspace.id),
      perPage: +perPage,
      page: +page,
    } as PaginationResponse<ProjectResponse>;

    if (!collection?.length) {
      SimpleLogger.warning(`No se encontraron proyectos registrados.`, 'ReadProjectsCollectionHandler', event.requestId);

      response.collection = [];
      response.length = 0;
      response.totalPages = 0;
      response.hasPrevious = false;
      response.hasNext = false;

      return ResponseEntity.ok(response);
    }

    const collector = new Array<ProjectResponse>();

    let project: Project;
    let projectDTO: ProjectResponse;

    for (project of collection) {
      projectDTO = {
        uid: project.uid,
        workspaceUid: ref,
        name: project.name,
        key: project.projectKey,
        visibility: project.visibility,
        visibilityLabel: LABEL.parse(project.visibility),
        status: LABEL.parse(project.status),
        created: project.createdAt,
        createdLabel: Dates.millisToLocalUserDatetime(project.createdAt),
        updated: project.updatedAt,
        updatedLabel: Dates.millisToLocalUserDatetime(project.updatedAt),
      } as ProjectResponse;

      collector.push(projectDTO);
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


export const ReadProjectsCollectionHandler = Middlify(ReadProjectsCollection, [
  ProvideLoggerMiddleware('ReadProjectsCollectionHandler'),
  ProvidePolicyMiddleware(),
]);

