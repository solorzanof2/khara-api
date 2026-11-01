import { BrickCategory } from '../../core/domain/BrickCategory';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';

export class BrickCategoryRepository extends Repository<BrickCategory> {
  constructor() { super(BrickCategory); }

}
