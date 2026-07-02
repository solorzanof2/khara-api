import { RoleRepository } from '../../adapters/persistence/RoleRepository';
import { UserRoleRepository } from '../../adapters/persistence/UserRoleRepository';
import { Role } from '../domain/Role';
import { UserRole } from '../domain/UserRole';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class RoleService {
  static readonly Sudo = 'SUDO';
  static readonly Admin = 'ADMIN';
  static readonly CompanyAdmin = 'COMPANY_ADMIN';
  static readonly ProjectManager = 'PROJECT_MANAGER';
  static readonly Contributor = 'CONTRIBUTOR';
  static readonly Viewer = 'VIEWER';

  private roleRepository: RoleRepository = new RoleRepository();
  private userRoleRepository: UserRoleRepository = new UserRoleRepository();

  constructor() { }

  async getAdmin(): Promise<Role> {
    return this.roleRepository.findByCode(RoleService.Admin);
  }

  async setUserAsAdmin(userId: number): Promise<void> {
    try {
      const role = await this.getAdmin();

      const model = new UserRole();
      model.roleId = role.id;
      model.userId = userId;

      await this.userRoleRepository.save(model);

      return useResolve();
    }
    catch (error) {
      return useReject(error);
    }
  }

}

