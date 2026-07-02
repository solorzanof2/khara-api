import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus, GlobalParentType } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class GlobalMention extends Model {

  uid: string = ''; // varchar(50) UNIQUE NOT NULL,
  createdAt: number = Date.now(); // bigint(20) NOT NULL,
  updatedAt: number = Date.now(); // bigint(20) NOT NULL,
  status: string = GlobalStatus.Active; // varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive',
  parentType: string = GlobalParentType.User; // varchar(32) NOT NULL DEFAULT 'user' COMMENT 'user | team | customer',
  parentId: number = 0; // bigint(20) NOT NULL COMMENT 'FK for parent type definition',
  mention: string = ''; // varchar(24) NOT NULL,
  displayName: string = ''; // varchar(24) NOT NULL

  constructor() {
    super(Partition.GlobalMentions);
    this.id = 0;
  }

}