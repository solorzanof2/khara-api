import { Action } from '../../core/domain/Action';
import { Policy } from '../../core/domain/Policy';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class PolicyRepository extends Repository<Policy> {

  constructor() {
    super(Policy);

    // this.joinTable({
    //   property: 'actions',
    //   joinTablename: 'actions_policies',
    //   joinColumn: 'policyId',
    //   inverseJoin: 'actionId',
    //   target: Action,
    // });
    this.inverseJoin({
      property: 'actions',
      mappedBy: 'policyId',
      target: Action,
    });
  }

  async findByRoleId(value: number): Promise<Policy> {
    try {
      this.mapAllRelations();

      this.selectQuery
        .equals('roleId', `${value}`)
        .orderByDesc('id');

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return Promise.resolve({} as Policy);
      }

      return Promise.resolve(rows[0]);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  async findByRoleIdIn(values: number[]): Promise<Policy[]> {
    try {
      this.mapAllRelations();

      this.selectQuery
        .in('roleId', values.map(value => value.toString()))
        .orderByDesc('id');

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return Promise.resolve(new Array<Policy>());
      }

      return Promise.resolve(rows);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

}

