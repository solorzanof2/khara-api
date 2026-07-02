import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class Menu extends Model {

  uid: string = ''; // varchar(50) [unique, not null]
  label: string = ''; // varchar(63) [not null]
  path: string = ''; // varchar(255) [not null]
  icon: string = ''; // varchar(63) [not null]
  status: string = GlobalStatus.Active; // varchar(16) [not null, default: 'active', note: 'active | inactive']
  createdAt: number = Date.now(); // bigint(20) [not null]
  updatedAt: number = Date.now(); // bigint(20) [not null]
  code: string = ''; // varchar(23) [not null]
  order: number = 0; // tinyint() [not null]

  constructor() {
    super(Partition.Menus);
    this.id = 0;
  }

}

