import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class PostComment extends Model {

  uid: string = ''; // varchar(50) [not null, unique]
  status: string = GlobalStatus.Pending; // varchar(20) [not null, default: 'pending', note: 'pending | done | reported | none']
  createdAt: number = Date.now(); // bigint(20) [not null]
  updatedAt: number = Date.now(); // bigint(20) [not null]
  markdownSource: string = ''; // longtext [not null]
  htmlSource: string = ''; // longtext [not null]
  parentId: number = 0; // bigint(20) [ref: > posts.id]
  userId: number = 0; // bigint(20) [ref: > users.id, not null]
  workspaceId: number = 0;
  projectId: number = 0;
  attributes: any = '';
  authorId: number = 0;

  constructor() {
    super(Partition.PostsComments);
    this.id = 0;
  }

}

