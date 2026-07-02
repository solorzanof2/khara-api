import { useIsValidGlobalVisibilityType } from '../../../core/commons/hooks/Validations';
import { Dates } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { ProjectService } from '../../../core/services/ProjectService';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { CompanyRepository } from '../../persistence/CompanyRepository';
import { PersonRepository } from '../../persistence/PersonRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';


interface RequestBody {
  workspaceUid: string;
  companyUid: string;
  name: string;
  key: string;
  visibility: string;
}


const CreateProject: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      name, key, visibility, workspaceUid, companyUid,
    } = event.body as RequestBody;

    if (!workspaceUid) {
      SimpleLogger.warning(`No se recibió un UID de workspace válido.`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!companyUid) {
      SimpleLogger.warning(`No se recibió un UID de company válido.`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!name || name.length < 3) {
      SimpleLogger.warning(`No se recibió un NOMBRE de proyecto válido o el mismo debe tener mínimo 3 caracteres: ${name}.`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!key) {
      SimpleLogger.warning(`No se recibió una KEY de proyecto válido.`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!visibility || !useIsValidGlobalVisibilityType(visibility)) {
      SimpleLogger.warning(`No se recibió una VISIBILITY de proyecto válida.`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const workspaceRepository = new WorkspaceRepository();
    const workspace = await workspaceRepository.findByUidAndStatusNotDeleted(workspaceUid);

    if (!workspace?.id) {
      SimpleLogger.warning(`No se encontró el WORKSPACE con el UID: ${workspaceUid}.`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const personRepository = new PersonRepository();
    const person = await personRepository.findByUid(companyUid);
    if (!person?.id) {
      SimpleLogger.warning(`No se encontró PERSON con el UID: ${companyUid}.`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const companyRepository = new CompanyRepository();
    const company = await companyRepository.findByWorkspaceIdAndPersonIdAndStatusNotDeleted(workspace.id, person.id);

    if (!company?.id) {
      SimpleLogger.warning(`No se encontró la COMPANY con el UID: ${companyUid}.`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findByWorkspaceUidAndCompanyUidAndNameAndStatusNotDeleted(workspace.id, company.id, name);

    if (project.id) {
      SimpleLogger.warning(`Ya el proyecto se encuentra registrado. name: ${name} | workspace: ${workspace.name} | company: ${person.name} ${person.lastname}`, 'CreateProjectHandler', event.requestId);
      return ResponseEntity.conflict('El proyecto ya se encuentra registrado.');
    }

    const projectService = new ProjectService();

    let model = await projectService.add(
      company.id,
      workspace.id,
      [name],
      [key],
      visibility,
    );

    let response = {
      uid: model.uid,
      workspaceUid, companyUid,
      name,
      key,
      created: model.createdAt,
      createdLabel: Dates.millisToLocalUserDatetime(model.createdAt),
      updated: model.updatedAt,
      updatedAt: Dates.millisToLocalUserDatetime(model.updatedAt),
      status: LABEL.parse(model.status),
      visibility
    };

    return ResponseEntity.ok(response);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const CreateProjectHandler = Middlify(CreateProject, [
  ProvideLoggerMiddleware('CreateProjectHandler'),
  ProvidePolicyMiddleware(),
]);

