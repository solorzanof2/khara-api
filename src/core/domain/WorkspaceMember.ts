import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus, GlobalRoleMemberType } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';
import { Workspace } from './Workspace';


export class WorkspaceMember extends Model {

  workspaceId: number = 0; // bigint(20),
  personId: number = 0; // bigint(20),
  uid: string = ''; // varchar(50) UNIQUE NOT NULL,
  role: string = GlobalRoleMemberType.Internal; // varchar(64) NOT NULL DEFAULT 'internal' COMMENT 'internal | external | contractor',
  status: string = GlobalStatus.Active; // varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  createdAt: number = Date.now(); // bigint(20) NOT NULL,
  updatedAt: number = Date.now(); // bigint(20) NOT NULL

  workspace: Workspace = new Workspace();

  constructor() {
    super(Partition.WorkspaceMembers);
    this.id = 0;
  }

}

