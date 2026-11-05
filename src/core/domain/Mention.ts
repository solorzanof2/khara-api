import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { Partition } from '../commons/constants/Partitions';

export class Mention extends Model {
  createdAt: number = 0;
  updatedAt: number = 0;
  userId: number = 0;
  parentId: number = 0;
  globalMentionId: number = 0;

  constructor() {
    super(Partition.Mentions);
    this.id = 0;
  }
}
