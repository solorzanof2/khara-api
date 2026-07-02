import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { Invitation } from '../../core/domain/Invitation';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class InvitationRepository extends Repository<Invitation> {

  constructor() {
    super(Invitation);
  }

  async findAllByCreatedBy(value: number): Promise<Invitation[]> {
    try {
      this.selectQuery
        .equals('createdBy', `${value}`);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Array<Invitation>());
      }

      return useResolve(rows);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByEmailAndStatusPending(value: string): Promise<Invitation> {
    try {
      this.selectQuery
        .equals('email', value).and()
        .notEquals('status', GlobalStatus.Expired)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Invitation());
      }

      return useResolve(rows[0] as Invitation);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

