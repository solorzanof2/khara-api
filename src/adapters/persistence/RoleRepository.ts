import { Menu } from '../../core/domain/Menu';
import { Role } from '../../core/domain/Role';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class RoleRepository extends Repository<Role> {

  constructor() {
    super(Role);

    this.joinTable({
      property: 'menus',
      joinTablename: 'roles_menus',
      joinColumn: 'roleId',
      inverseJoin: 'menuId',
      target: Menu,
    });
  }

  async findByUid(value: string): Promise<Role> {
    try{
      this.selectQuery
        .equals('uid', value)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve({} as Role);
      }

      return useResolve(rows[0]);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByCode(value: string): Promise<Role> {
    try {
      this.selectQuery
        .equals('code', value)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve({} as Role);
      }

      return useResolve(rows[0]);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

