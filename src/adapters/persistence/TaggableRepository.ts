import { Taggable } from '../../core/domain/Taggable';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';

export class TaggableRepository extends Repository<Taggable> {
  constructor() { super(Taggable); }

  async deleteByParentId(parentId: number): Promise<void> {
    await this.database.prepare(this.delete().equals('parentId', String(parentId)));
  }
}
