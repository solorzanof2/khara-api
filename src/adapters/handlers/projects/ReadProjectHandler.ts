import { Dates } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { ProjectRepository } from '../../persistence/ProjectRepository';


const ReadProject: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      ref,
    } = event.queryStringParameters;

    if (!ref) {
      SimpleLogger.warning(`No se recibió el UID de referencia para leer el proyecto.`, 'ReadProjectHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const projectRepository = new ProjectRepository();

    const project = await projectRepository.findByUid(ref);

    if (!project?.id) {
      SimpleLogger.warning(`No se encontró el proyecto con el UID: ${ref}`, 'ReadProjectHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const model = {
      uid: project.uid,
      name: project.name,
      key: project.projectKey,
      visibility: project.visibility,
      visibilityLabel: LABEL.parse(project.visibility),
      created: project.createdAt,
      createdLabel: Dates.millisToLocalUserDatetime(project.createdAt),
      updated: project.updatedAt,
      updatedLabel: Dates.millisToLocalUserDatetime(project.updatedAt),
      status: project.status,
      statusLabel: LABEL.parse(project.status),
    } as const;

    return ResponseEntity.ok(model);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const ReadProjectHandler = Middlify(ReadProject, [
  ProvideLoggerMiddleware('ReadProjectHandler'),
  ProvidePolicyMiddleware(),
]);

