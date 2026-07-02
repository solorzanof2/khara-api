import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class Invitation extends Model {

  uid: string = ''; // VARCHAR(50) NOT NULL DEFAULT '0' COLLATE 'latin1_swedish_ci',
  workspaceId: number = 0; // BIGINT(20) NOT NULL DEFAULT '0',
  email: string = ''; // VARCHAR(512) NOT NULL DEFAULT '0' COLLATE 'latin1_swedish_ci',
  roleId: number = 0; // BIGINT(20) NOT NULL DEFAULT '0',
  token: string = ''; // VARCHAR(512) NOT NULL DEFAULT '0' COLLATE 'latin1_swedish_ci',
  status: string = GlobalStatus.Pending; // VARCHAR(20) NOT NULL DEFAULT '0' COMMENT 'pending, accepted, expired' COLLATE 'latin1_swedish_ci',
  expiresAt: number = Date.now(); // BIGINT(20) NOT NULL DEFAULT '0',
  createdAt: number = Date.now(); // BIGINT(20) NOT NULL DEFAULT '0',
  updatedAt: number = Date.now(); // BIGINT(20) NOT NULL DEFAULT '0',
  createdBy: number = 0; // BIGINT(20) NOT NULL DEFAULT '0',

  constructor() {
    super(Partition.Invitations);
  }

}

