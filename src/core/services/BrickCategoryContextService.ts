import { PostInsightRepository } from '../../adapters/persistence/PostInsightRepository';
import { ProjectRepository } from '../../adapters/persistence/ProjectRepository';
import { WorkspaceRepository } from '../../adapters/persistence/WorkspaceRepository';
import { Exception } from '../../deepcore/application/core/Exception';
import { HttpStatus } from '../../deepcore/application/http/HttpContracts';
import { GlobalStatus } from '../commons/constants/GlobalConstants';

export class BrickCategoryContextService {
  async project(ref: unknown, workspaceUid: unknown) {
    if ([ref, workspaceUid].some(value => typeof value !== 'string' || !value.trim())) {
      throw new Exception('Falta la referencia del insight o workspace.', HttpStatus.BadRequest);
    }
    const workspace = await new WorkspaceRepository().findByUidAndStatusNotDeleted(workspaceUid as string);
    if (!workspace?.id) throw new Exception('El workspace no existe.', HttpStatus.NotFound);
    const insight = await new PostInsightRepository().findByUid(ref as string);
    if (!insight?.id || insight.status === GlobalStatus.Deleted || insight.workspaceId !== workspace.id) {
      throw new Exception('El insight no existe en el workspace.', HttpStatus.NotFound);
    }
    const project = await new ProjectRepository().findByIdAndStatusNotDeleted(insight.projectId);
    if (!project?.id || project.workspaceId !== workspace.id) throw new Exception('El proyecto no existe en el workspace.', HttpStatus.NotFound);
    return project;
  }
}
