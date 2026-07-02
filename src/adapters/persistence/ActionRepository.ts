import { Action } from '../../core/domain/Action';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class ActionRepository extends Repository<Action> {

  constructor() {
    super(Action);
  }

}

