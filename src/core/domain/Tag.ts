import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { Partition } from '../commons/constants/Partitions';


export class Tag extends Model {

  name: string = '';
  category: string = '';
  link: string = '';
  usageCount: number = 1;
  userId: number = 0;

  constructor() {
    super(Partition.Tags);
    this.id = 0;
  }

}

