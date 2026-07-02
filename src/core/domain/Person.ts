import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalPersonType, GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';
// import { User } from './User';


export interface PersonDTO {

  createdAt: number;
  updatedAt: number;
  status: string;
  uid: string;
  userId: number;
  name: string;
  lastname: string;
  attributes: any;
  personType: string;
  /* Esto fue movido a attributes */
  attachments: any;

}


export class Person extends Model implements PersonDTO {

  createdAt: number = Date.now(); // bigint(20) [not null]
  updatedAt: number = Date.now(); // bigint(20) [not null]
  status: string = GlobalStatus.Active; // varchar(15) [not null, default: 'active']
  uid: string = ''; // varchar(127) [not null, unique]
  userId: number = 0; // bigint(20) [ref: > users.id]
  name: string = ''; // varchar(63) [not null]
  lastname: string = ''; // varchar(63) [null]
  // document: string = ''; // varchar(11) [not null]
  attributes: any = ''; // json [not null]
  personType: string = GlobalPersonType.Natural; // varchar(8) [not null, default: 'FISICA', note: 'FISICA, JURIDICA']
  /* Esto fue movido a attributes */
  // province: string = ''; // varchar(63) [not null]
  // locality: string = ''; // varchar(63) [not null]
  attachments: any = ''; // json [not null]

  // user: User;

  constructor() {
    super(Partition.Persons);
    this.id = 0;
    // this.user = new User();
  }

}

