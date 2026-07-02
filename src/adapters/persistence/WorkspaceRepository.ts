import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { Workspace } from '../../core/domain/Workspace';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class WorkspaceRepository extends Repository<Workspace> {

  constructor() {
    super(Workspace);
  }

  async findByPersonId(value: number): Promise<Workspace> {
    try {
      this.selectQuery
        .equals('personId', `${value}`)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Workspace());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByUid(value: string): Promise<Workspace> {
    try {
      this.selectQuery
        .equals('uid', value)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Workspace());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByUidAndStatusNotDeleted(value: string): Promise<Workspace> {
    try {
      this.selectQuery
        .equals('uid', value).and()
        .notEquals('status', GlobalStatus.Deleted)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Workspace());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

