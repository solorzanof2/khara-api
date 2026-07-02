import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus, GlobalVisibilityType } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';
import { PersonDTO } from './Person';
import { WorkspaceRef } from './Workspace';


export class Project extends Model {

  uid: string = ''; // varchar(50) UNIQUE NOT NULL,
  workspaceId: number = 0; // bigint(20) NOT NULL,
  companyId: number = 0; // bigint(20) NOT NULL,
  name: string = ''; // varchar(255) NOT NULL,
  projectKey: string = ''; // varchar(64) NOT NULL,
  visibility: string = GlobalVisibilityType.Private; // varchar(12) NOT NULL DEFAULT 'internal' COMMENT 'private | internal | team | restricted | public',
  status: string = GlobalStatus.Active; // varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  createdAt: number = 0; // bigint(20) NOT NULL,
  updatedAt: number = 0; // bigint(20) NOT NULL

  workspace: WorkspaceRef = {} as WorkspaceRef;
  company: PersonDTO = {} as PersonDTO;

  constructor() {
    super(Partition.Projects);
    this.id = 0;
  }

}

