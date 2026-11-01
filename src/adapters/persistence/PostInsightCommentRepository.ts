import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { InsightComment } from '../../core/domain/InsightComment';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class PostInsightCommentRepository extends Repository<InsightComment> {

  constructor() {
    super(InsightComment);
  }

  async findByUid(value: string): Promise<InsightComment> {
    this.selectQuery.equals('uid', value).limit(1);
    const [row] = await this.execute(this.selectQuery);
    return row || new InsightComment();
  }

  async findByParentId(value: number): Promise<InsightComment[]> {
    this.selectQuery.equals('parentId', String(value)).and().equals('status', GlobalStatus.Active);
    return this.execute(this.selectQuery);
  }
}
