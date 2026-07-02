import { InsightComment } from '../../core/domain/InsightComment';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class PostInsightCommentRepository extends Repository<InsightComment> {

  constructor() {
    super(InsightComment);
  }

}

