import { GlobalMention } from '../../core/domain/GlobalMention';
import { Person } from '../../core/domain/Person';
import { Role } from '../../core/domain/Role';
import { User } from '../../core/domain/User';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class UserRepository extends Repository<User> {

  constructor() {
    super(User);

    this.joinTable({
      property: 'roles',
      joinTablename: 'users_roles',
      joinColumn: 'userId',
      inverseJoin: 'roleId',
      target: Role,
    });

    this.inverseJoin({
      property: 'person',
      mappedBy: 'userId',
      target: Person,
      type: 'class',
    });

    this.inverseJoin({
      property: 'mentions',
      mappedBy: 'parentId',
      target: GlobalMention,
      type: 'collection',
      joinType: 'LEFT',
    });
  }

  async findByUid(value: string): Promise<User> {
    try {
      this.mapAllRelations();

      this.selectQuery
        .equals('uid', value)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new User());
      }

      const [row] = rows;

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByUsername(value: string): Promise<User> {
    try {
      this.mapAllRelations();

      this.selectQuery
        .equals('username', value)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new User());
      }

      const [row] = rows;

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByEmail(value: string): Promise<User> {
    try {
      this.selectQuery
        .equals('email', value)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new User());
      }

      const [row] = rows;

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findUserByUsername(value: string): Promise<User> {
    try {
      this.selectQuery
        .equals('username', value)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new User());
      }

      const [row] = rows;

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

