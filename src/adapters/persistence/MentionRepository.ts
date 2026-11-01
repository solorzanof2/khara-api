import { Mention } from '../../core/domain/Mention';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';

export class MentionRepository extends Repository<Mention> {
  async deleteByParentIdAndParentType(parentId: number, parentType: string): Promise<void> {
    const query = this.delete().equals('parentId', String(parentId)).and().equals('parentType', parentType);
    await this.database.prepare(query);
  }

  constructor() {
    super(Mention);
  }
}
