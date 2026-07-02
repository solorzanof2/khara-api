import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { Partition } from '../commons/constants/Partitions';


export class Company extends Model {

  personId: number = 0; //  bigint(20),
  workspaceId: number = 0; //  bigint(20),
  companyType: string = ''; //  varchar(8) NOT NULL DEFAULT 'internal' COMMENT 'internal | external',
  uid: string = ''; //  varchar(50) UNIQUE NOT NULL,
  status: string = ''; //  varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  createdAt: number = 0; //  bigint(20) NOT NULL,
  updatedAt: number = 0; //  bigint(20) NOT NULL

  constructor() {
    super(Partition.Companies);
    this.id = 0;
  }

}

