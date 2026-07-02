import { Person } from '../../core/domain/Person';
import { User } from '../../core/domain/User';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class PersonRepository extends Repository<Person> {

  constructor() {
    super(Person);

    this.joinColumn({
      property: 'user',
      fieldName: 'userId',
      target: User,
      updatable: false,
      joinType: 'INNER',
    });
  }

  async findByUid(value: string): Promise<Person> {
    try {
      this.selectQuery
        .equals('uid', value)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Array<Person>());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

