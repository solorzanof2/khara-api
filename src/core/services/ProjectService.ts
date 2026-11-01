import { CompanyRepository } from '../../adapters/persistence/CompanyRepository';
import { ProjectRepository } from '../../adapters/persistence/ProjectRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { GlobalStatus, GlobalVisibilityType } from '../commons/constants/GlobalConstants';
import { Project } from '../domain/Project';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class ProjectService {

  private projectRepository: ProjectRepository = new ProjectRepository();

  constructor() { }

  async add(companyId: number, workspaceId: number, name: string[], projectKey: string[], visibility: string): Promise<Project> {
    try {
      const now = Date.now();

      let model = new Project();
      model.uid = Security.getRandomGUID();
      model.workspaceId = workspaceId;
      model.companyId = companyId;
      model.name = name.join(' ');
      model.projectKey = projectKey.join('');
      model.visibility = visibility;
      model.status = GlobalStatus.Active;
      model.createdAt = now;
      model.updatedAt = now;

      model = await this.projectRepository.save(model, true);

      return useResolve(model);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async getOrCreateDefault(workspaceId: number): Promise<Project> {
    // Reserved key keeps the workspace fallback distinct from ordinary project names.
    const projectKey = '__general__';
    const existing = await this.projectRepository.findByWorkspaceIdAndProjectKeyAndStatusNotDeleted(workspaceId, projectKey);
    if (existing?.id) {
      return useResolve(existing);
    }

    const companyRepository = new CompanyRepository();
    const company = await companyRepository.findInternalByWorkspaceIdAndStatusNotDeleted(workspaceId);
    if (!company?.id) {
      return useReject(new Error('No se encontró una compañía interna para crear el proyecto General.'));
    }

    return this.add(company.id, workspaceId, ['General'], [projectKey], GlobalVisibilityType.Internal);
  }

  async update(model: Project, name: string[], projectKey: string[], visibility: string): Promise<Project> {
    try {
      model.name = name.join(' ');
      model.projectKey = projectKey.join('');
      model.visibility = visibility;
      model.updatedAt = Date.now();

      model = await this.projectRepository.save(model, true);

      return useResolve(model);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

