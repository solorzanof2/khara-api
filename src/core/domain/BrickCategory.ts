import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { Partition } from '../commons/constants/Partitions';

export class BrickCategory extends Model {
  id = 0;
  name = '';
  constructor() { super(Partition.BrickCategories); }
}
