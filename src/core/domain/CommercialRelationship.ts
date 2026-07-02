import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus, GlobalParentType } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class CommercialRelationship extends Model {

  uid: string = ''; // varchar(50) UNIQUE NOT NULL,
  aPersonId: number = 0; // bigint(20) NOT NULL,
  bPersonId: number = 0; // bigint(20) NOT NULL,
  relationType: string = GlobalParentType.Client; // varchar(24) NOT NULL DEFAULT 'client' COMMENT 'client | supplier | partner',
  since: string = ''; // bigint(20) NOT NULL COMMENT 'relation is from date',
  until: string = ''; // bigint(20) NOT NULL COMMENT 'relation is to date',
  status: string = GlobalStatus.Active; // varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  createdAt: number = Date.now(); // bigint(20) NOT NULL,
  updatedAt: number = Date.now(); // bigint(20) NOT NULL

  constructor() {
    super(Partition.CommercialRelationships);
    this.id = 0;
  }

}

