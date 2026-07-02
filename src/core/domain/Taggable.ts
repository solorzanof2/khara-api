import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalTaggableType } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class Taggable extends Model {

  uid: string = ''; // varchar(50) [unique, not null]
  createdAt: number = 0; // bigint(20) [not null]
  updatedAt: number = 0; // bigint(20) [not null]
  tagId: number = 0; // bigint [ref: > tags.id]
  parentType: string = GlobalTaggableType.Post; // varchar(127) [not null, default: 'post', note: 'post, post_comment, insight, insight_comment, insight_brick']
  parentId: number = 0; // bigint(20) [not null]
  userId: number = 0; // bigint(20) [ref: > users.id]
  attributes: any = '';

  constructor() {
    super(Partition.Taggables);
    this.id = 0;
  }

}

