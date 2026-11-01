import { Mention } from '../../core/domain/Mention';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';

export class MentionRepository extends Repository<Mention> {
  constructor() {
    super(Mention);
  }
}
