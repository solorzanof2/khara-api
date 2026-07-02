import { WorkspaceMember } from '../../core/domain/WorkspaceMember';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class WorkspaceMemberRepository extends Repository<WorkspaceMember> {

  constructor() {
    super(WorkspaceMember);
  }

}

