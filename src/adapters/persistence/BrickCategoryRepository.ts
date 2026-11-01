import { BrickCategory } from '../../core/domain/BrickCategory';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';

export class BrickCategoryRepository extends Repository<BrickCategory> {
  constructor() { super(BrickCategory); }

  async getOrCreate(name: string): Promise<BrickCategory> {
    await this.queryBySql('INSERT INTO brick_categories (name) VALUES (?) ON DUPLICATE KEY UPDATE id = id', [name]);
    this.selectQuery.equals('name', name).limit(1);
    const [saved] = await this.execute(this.selectQuery);
    if (!saved) throw new Error('No se pudo resolver la categoría.');
    return saved;
  }
}
