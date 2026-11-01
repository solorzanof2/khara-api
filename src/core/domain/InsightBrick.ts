import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class InsightBrick extends Model {

  uid: string = ''; // varchar(50) [unique, not null]
  parentId: number = 0; // bigint(20) [ref: > posts_insights.id]
  markdownSource: string = '';
  htmlSource: string = '';
  category: string = ''; // varchar(128) [not null]
  createdAt: number = 0; // bigint(20) [not null]
  updatedAt: number = 0; // bigint(20) [not null]
  attributes: any = ''; // json [not null]
  status: string = GlobalStatus.Pending; // varchar(20) [not null, default: 'pending', note: 'pending | done | reported | none']
  userId: number = 0; // bigint(20) [ref: > users.id, not null]
  workspaceId: number = 0;
  projectId: number = 0;
  authorId: number = 0;

  constructor() {
    super(Partition.InsightBricks);
  }

}

