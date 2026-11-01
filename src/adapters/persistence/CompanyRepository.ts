import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { Company } from '../../core/domain/Company';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class CompanyRepository extends Repository<Company> {

  constructor() {
    super(Company);
  }

  async findInternalByWorkspaceIdAndStatusNotDeleted(workspaceId: number): Promise<Company> {
    try {
      this.selectQuery
        .equals('workspaceId', String(workspaceId)).and()
        .equals('companyType', 'internal').and()
        .notEquals('status', GlobalStatus.Deleted)
        .orderByAsc('id')
        .limit(1);
      const [row] = await this.execute(this.selectQuery);
      return useResolve(row?.id ? row : new Company());
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByUid(value: string): Promise<Company> {
    try {
      this.selectQuery
        .equals('uid', value)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Company());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByUidAndStateNotDeleted(value: string): Promise<Company> {
    try {
      this.selectQuery
        .equals('uid', value).and()
        .notEquals('status', GlobalStatus.Deleted)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Company());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByWorkspaceIdAndPersonIdAndStatusNotDeleted(workspaceId: number, personId: number): Promise<Company> {
    try {
      this.selectQuery
        .equals('workspaceId', `${workspaceId}`).and()
        .equals('personId', `${personId}`).and()
        .notEquals('status', GlobalStatus.Deleted)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Company());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

