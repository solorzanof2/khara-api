import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class Action extends Model {

  name: string = ''; // varchar(256) [not null]
  method: string = ''; // varchar(127) [unique, not null] // CREATE_USER
  policyId: number = 0; // bigint(20) [ref: > policies.id, not null]
  uid: string = ''; // varchar(50) [unique, not null]
  status: string = GlobalStatus.Active; // varchar (16) [not null, default: 'active', note: 'active | inactive']
  createdAt: number = Date.now(); // bigint(20) [not null]
  updatedAt: number = Date.now(); // bigint(20) [not null]

  constructor() {
    super(Partition.Actions);
    this.id = 0;
  }

}

