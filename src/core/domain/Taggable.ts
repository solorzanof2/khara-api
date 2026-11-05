import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { Partition } from '../commons/constants/Partitions';


export class Taggable extends Model {

  uid: string = ''; // varchar(50) [unique, not null]
  createdAt: number = 0; // bigint(20) [not null]
  updatedAt: number = 0; // bigint(20) [not null]
  tagId: number = 0; // bigint [ref: > tags.id]
  parentId: number = 0; // bigint(20) [not null]
  userId: number = 0; // bigint(20) [ref: > users.id]

  constructor() {
    super(Partition.Taggables);
    this.id = 0;
  }

}

