import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';
import { Menu } from './Menu';


export class Role extends Model {

  name: string = ''; // varchar(511) [unique, not null]
  code: string = ''; // varchar(127) [unique, not null] // *, ADMIN, SUDO,
  uid: string = ''; // varchar(127) [unique, not null]
  status: string = GlobalStatus.Active; // varchar (16) [not null, default: 'active', note: 'active | inactive']
  createdAt: number = Date.now(); // bigint(20) [not null]
  updatedAt: number = Date.now(); // bigint(20) [not null]

  menus: Menu[] = new Array<Menu>();

  constructor() {
    super(Partition.Roles);
    this.id = 0;
  }

}

