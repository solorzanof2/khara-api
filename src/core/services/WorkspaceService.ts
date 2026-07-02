import { WorkspaceRepository } from '../../adapters/persistence/WorkspaceRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Workspace } from '../domain/Workspace';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class WorkspaceService {

  private workspaceRepository: WorkspaceRepository = new WorkspaceRepository();

  constructor() { }

  async add(personId: number, displayName: string[]): Promise<Workspace> {
    try {
      const now = Date.now();

      let model = new Workspace();
      model.personId = personId;
      model.name = `${displayName.join(' ')} Workspace`;
      model.uid = Security.getRandomGUID();
      model.status = GlobalStatus.Active;
      model.createdAt = now;
      model.updatedAt = now;

      model = await this.workspaceRepository.save(model, true);

      return useResolve(model);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

