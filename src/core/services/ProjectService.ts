import { ProjectRepository } from '../../adapters/persistence/ProjectRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
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

