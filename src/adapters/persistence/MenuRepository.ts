import { Menu } from '../../core/domain/Menu';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class MenuRepository extends Repository<Menu> {

  constructor() {
    super(Menu);
  }

}

