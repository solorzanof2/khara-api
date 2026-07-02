import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export interface WorkspaceRef {

  personId: number;
  name: string;
  uid: string;
  status: string;
  createdAt: number;
  updatedAt: number;

}


export class Workspace extends Model implements WorkspaceRef {

  personId: number = 0; // bigint(20) NOT NULL,
  name: string = ''; // varchar(63) NOT NULL,
  uid: string = ''; // varchar(50) UNIQUE NOT NULL,
  status: string = GlobalStatus.Active; // varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  createdAt: number = Date.now(); // bigint(20) NOT NULL,
  updatedAt: number = Date.now(); // bigint(20) NOT NULL

  constructor() {
    super(Partition.Workspaces);
    this.id = 0;
  }

}

