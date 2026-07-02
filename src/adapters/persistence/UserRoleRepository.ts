import { UserRole } from '../../core/domain/UserRole';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class UserRoleRepository extends Repository<UserRole> {

  constructor() {
    super(UserRole);
  }

}

