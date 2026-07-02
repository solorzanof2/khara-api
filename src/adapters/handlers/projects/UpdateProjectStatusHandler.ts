import { useIsValidProjectStatus } from '../../../core/commons/hooks/Validations';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { ProjectRepository } from '../../persistence/ProjectRepository';


interface RequestBody {
  uid: string;
  status: string;
}


const UpdateProjectStatus: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      uid, status,
    } = event.body as RequestBody;

    if (!uid) {
      SimpleLogger.warning(`No se recibió un UID válido.`, 'UpdateProjectStatusHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!status || !useIsValidProjectStatus(status)) {
      SimpleLogger.warning(`No se recibió un STATUS válido.`, 'UpdateProjectStatusHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const projectRepository = new ProjectRepository();

    const project = await projectRepository.findByUidAndStatusNotDeleted(uid);

    if (!project?.id) {
      SimpleLogger.warning(`No se encontró un PROJECT con el UID: ${uid}. [404] Not Found.`, 'UpdateProjectStatusHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    project.status = status;
    project.updatedAt = Date.now();

    try {
      await projectRepository.save(project);
    }
    catch (error) {
      SimpleLogger.warning(`No se pudo actualizar el estado del proyecto: ${project.uid}, status: ${status}. [EXCEPTION]: ${error.message}`, 'UpdateProjectStatusHandler', event.requestId);
      return ResponseEntity.conflict('No se pudo actualizar el estado del proyecto.');
    }

    return ResponseEntity.noContent();
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const UpdateProjectStatusHandler = Middlify(
  UpdateProjectStatus,
  [
    ProvideLoggerMiddleware('UpdateProjectStatusHandler'),
    ProvidePolicyMiddleware(),
  ],
);

