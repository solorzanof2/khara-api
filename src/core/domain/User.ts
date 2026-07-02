import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';
import { GlobalMention } from './GlobalMention';
import { Person } from './Person';
import { Role } from './Role';


export class User extends Model {

  uid: string = ''; // varchar(50) [unique, not null]
  status: string = GlobalStatus.Active; // varchar(16) [not null, default: 'pending', note: 'pending | active | inactive']
  createdAt: number = Date.now(); // bigint(20) [not null]
  updatedAt: number = Date.now(); // bigint(20) [not null]
  password: string = ''; // varchar(256) [not null]
  email: string = ''; // varchar(256) [not null]
  username: string = ''; // varchar(128) [not null, unique]
  attributes: any = ''; // attributes json [not null]

  roles: Role[] = new Array<Role>();
  person: Person = new Person();
  mentions: GlobalMention[] = new Array<GlobalMention>();

  constructor() {
    super(Partition.Users);
    this.id = 0;
  }

}

