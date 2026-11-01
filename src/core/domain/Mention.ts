import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { Partition } from '../commons/constants/Partitions';
import { GlobalTaggableType } from '../commons/constants/GlobalConstants';

export class Mention extends Model {
  uid: string = '';
  createdAt: number = 0;
  updatedAt: number = 0;
  userId: number = 0;
  parentType: string = GlobalTaggableType.Post;
  parentId: number = 0;
  globalMentionId: number = 0;

  constructor() {
    super(Partition.Mentions);
    this.id = 0;
  }
}
