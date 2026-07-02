import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { Partition } from '../commons/constants/Partitions';


export class UserRole extends Model {

  userId: number = 0; // bigint(20) NOT NULL,
  roleId: number = 0; // bigint(20) NOT NULL

  constructor() {
    super(Partition.UserRoles);
    this.id = 0;
  }

}

