import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { Person } from '../../core/domain/Person';
import { Project } from '../../core/domain/Project';
import { Workspace } from '../../core/domain/Workspace';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class ProjectRepository extends Repository<Project> {

  constructor() {
    super(Project);

    this.joinColumn({
      property: 'workspace',
      fieldName: 'workspaceId',
      target: Workspace,
      updatable: false,
      joinType: 'INNER',
    });

    this.joinColumn({
      property: 'company',
      fieldName: 'personId',
      target: Person,
      updatable: false,
      joinType: 'INNER',
    });
  }

  async findByUid(value: string): Promise<Project> {
    try {
      this.selectQuery
        .equals('uid', value)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Project());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByUidAndStatusNotDeleted(value: string): Promise<Project> {
    try {
      this.selectQuery
        .equals('uid', value).and()
        .notEquals('status', GlobalStatus.Deleted)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Project());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }


  async findByIdAndStatusNotDeleted(value: number): Promise<Project> {
    try {
      this.selectQuery
        .equals('id', `${value}`).and()
        .notEquals('status', GlobalStatus.Deleted)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Project());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }


  async findByName(value: string): Promise<Project> {
    try {
      this.selectQuery
        .equals('name', value)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Project());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByWorkspaceUidAndCompanyUidAndNameAndStatusNotDeleted(workspaceId: number, companyId: number, name: string): Promise<Project> {
    try {
      this.selectQuery
        .equals('workspaceId', `${workspaceId}`).and()
        .equals('companyId', `${companyId}`).and()
        .equals('name', name).and()
        .notEquals('status', GlobalStatus.Deleted)
        .limit(1);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Project());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findAllPaginatedByWorkspaceIdAndStatusNotDeleted(workspaceId: number, offset: number, limit: number = 10): Promise<Project[]> {
    try {
      this.selectQuery
        .equals('workspaceId', `${workspaceId}`).and()
        .notEquals('status', GlobalStatus.Deleted)
        .paginate(offset, limit)
        .orderByDesc('id');

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Array<Project>());
      }

      return useResolve(rows);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async countByWorkspaceIdAndStatusActive(value: number): Promise<number> {
    try {
      const queryBuilder = [
        "SELECT COUNT(`t0`.id) AS total",
        "FROM `projects` `t0`",
        "WHERE `t0`.workspaceId = ?",
        "AND `t0`.status = ?"
      ];

      const params = [
        `${value}`,
        GlobalStatus.Active,
      ];

      const total = await super.countByQuery(queryBuilder.join(' '), params);

      return useResolve(total);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

