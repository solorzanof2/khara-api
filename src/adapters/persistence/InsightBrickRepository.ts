import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { InsightBrick } from '../../core/domain/InsightBrick';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';

export class InsightBrickRepository extends Repository<InsightBrick> {
  constructor() { super(InsightBrick); }

  async findByUid(value: string): Promise<InsightBrick> {
    this.selectQuery.equals('uid', value).limit(1);
    const [row] = await this.execute(this.selectQuery);
    return row || new InsightBrick();
  }

  async findByParentId(value: number): Promise<InsightBrick[]> {
    this.selectQuery.equals('parentId', String(value)).and().notEquals('status', GlobalStatus.Deleted);
    return this.execute(this.selectQuery);
  }
  async saveChanges(entity: InsightBrick, previous: { attributes: any; updatedAt: number }): Promise<boolean> {
    const snapshot = typeof previous.attributes === 'string' ? previous.attributes : JSON.stringify(previous.attributes || {});
    const result = await this.queryBySql<{ affectedRows: number }>(
      'UPDATE insights_bricks SET category = ?, markdownSource = ?, htmlSource = ?, attributes = ?, updatedAt = ? '
      + 'WHERE id = ? AND updatedAt = ? AND BINARY CAST(attributes AS CHAR) = BINARY ? AND status <> ?',
      [entity.category, entity.markdownSource, entity.htmlSource, entity.attributes, String(entity.updatedAt),
        String(entity.id), String(previous.updatedAt), snapshot, GlobalStatus.Deleted],
    );
    return result.affectedRows === 1;
  }
}
