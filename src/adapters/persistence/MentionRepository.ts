import { Mention } from '../../core/domain/Mention';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';

export class MentionRepository extends Repository<Mention> {

  async deleteByParentId(parentId: number): Promise<void> {
    const query = this
      .delete()
      .equals('parentId', String(parentId));

    await this.database.prepare(query);
  }

  constructor() {
    super(Mention);
  }
}
