import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';
import { Action } from './Action';


export class Policy extends Model {

  name: string = ''; // varchar(127) [unique, not null]
  code: string = ''; // varchar(127) [unique, not null]
  uid: string = ''; // varchar(50) [unique, not null]
  status: string = GlobalStatus.Active; // varchar (16) [not null, default: 'active', note: 'active | inactive']
  createdAt: number = Date.now(); // bigint(20) [not null]
  updatedAt: number = Date.now(); // bigint(20) [not null]
  roleId: number = 0; // bigint(20) [ref: > roles.id, not null]
  effect: string = ''; // varchar(8) [not null, default: 'allow', note: 'allow | deny']

  actions: Action[] = new Array<Action>();

  constructor() {
    super(Partition.Policies);
    this.id = 0;
  }

}

