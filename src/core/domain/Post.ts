import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus, GlobalVisibilityType } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';
import { GlobalMention } from './GlobalMention';
import { PostComment } from './PostComment';
import { PostInsight } from './PostInsight';


export class Post extends Model {

  uid: string = '';
  status: string = GlobalStatus.Active;
  htmlSource: string = '';
  markdownSource: string = '';
  createdAt: number = 0;
  updatedAt: number = 0;
  attributes: any = '';
  workspaceId: number = 0;
  projectId: number = 0;
  visibility: string = GlobalVisibilityType.Internal;
  userId: number = 0;
  authorId: number = 0;

  comments: PostComment[] = new Array<PostComment>();
  insights: PostInsight[] = new Array<PostInsight>();
  author: GlobalMention = new GlobalMention();

  constructor() {
    super(Partition.Posts);
    this.id = 0;
  }

}

