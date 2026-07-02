import { WorkspaceMemberRepository } from '../../adapters/persistence/WorkspaceMemberRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { WorkspaceMember } from '../domain/WorkspaceMember';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class WorkspaceMemberService {

  private workspaceMemberRepository: WorkspaceMemberRepository = new WorkspaceMemberRepository();

  constructor() { }

  async add(workspaceId: number, personId: number, roleMemberType: string): Promise<void> {
    try {
      const now = Date.now();

      const model = new WorkspaceMember();
      model.workspaceId = workspaceId;
      model.personId = personId;
      model.uid = Security.getRandomGUID();
      model.role = roleMemberType;
      model.createdAt = now;
      model.updatedAt = now;

      await this.workspaceMemberRepository.save(model);

      return useResolve();
    }
    catch (error) {
      return useReject(error);
    }
  }

}

