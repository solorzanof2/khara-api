import { SimpleLogger } from '../../deepcore/application/helpers/SimpleLogger';
import { UseCase, UseCaseOptions } from '../../deepcore/contracts/UseCase';
import { GlobalParentType, GlobalPersonType, GlobalRoleMemberType, GlobalVisibilityType } from '../commons/constants/GlobalConstants';
import { Company } from '../domain/Company';
import { Person } from '../domain/Person';
import { User } from '../domain/User';
import { Workspace } from '../domain/Workspace';
import { useReject, useResolve } from '../helpers/functions/Promises';
import { CompanyService } from '../services/CompanyService';
import { GlobalMentionService } from '../services/GlobalMentionService';
import { PersonService } from '../services/PersonService';
import { ProjectService } from '../services/ProjectService';
import { RoleService } from '../services/RoleService';
import { UserService } from '../services/UserService';
import { WorkspaceMemberService } from '../services/WorkspaceMemberService';
import { WorkspaceService } from '../services/WorkspaceService';


export class SignUpAdminUseCase implements UseCase {
  private readonly DefaultError = 'error.signup';

  private userService: UserService = new UserService();
  private personService: PersonService = new PersonService();
  private globalMentionService: GlobalMentionService = new GlobalMentionService();
  private workspaceService: WorkspaceService = new WorkspaceService();
  private workspaceMemberService: WorkspaceMemberService = new WorkspaceMemberService();
  private companyService: CompanyService = new CompanyService();
  private projectService: ProjectService = new ProjectService();
  private roleService: RoleService = new RoleService();

  async execute<T>(options: UseCaseOptions): Promise<T> {
    try {
      const {
        username, email, password, name, lastname,
      } = options;

      // create user;
      let user: User;
      try {
        user = await this.userService.add(
          username,
          email,
          password
        );
      }
      catch (error) {
        SimpleLogger.warning(`No se pudo crear el usuario ${email} | username: ${username} - ${error.message}`, 'CreateUserUseCase');
        return useReject(new Error(this.DefaultError));
      }

      // create person;
      let person: Person;
      try {
        person = await this.personService.add(
          name,
          lastname,
          user.id,
          GlobalPersonType.Natural
        );
      }
      catch (error) {
        SimpleLogger.warning(`No se pudo crear la persona para el usuario: ${email} | user: ${user.id} - ${error.message}`, 'CreateUserUseCase');
        return useReject(new Error(this.DefaultError))
      }

      // create global mention;
      try {
        await this.globalMentionService.add(
          username,
          [person.name, person.lastname],
          user.id,
          GlobalParentType.User
        );
      }
      catch (error) {
        SimpleLogger.warning(`No se pudo crear el Global Mention para el usuario: ${email} | user: ${user.id} - ${error.message}`, 'CreateUserUseCase');
        return useReject(new Error(this.DefaultError));
      }

      // create workspace;
      let workspace: Workspace;
      try {
        workspace = await this.workspaceService.add(
          person.id,
          [person.name, person.lastname]
        );
      }
      catch (error) {
        SimpleLogger.warning(`No se pudo crear el Workspace para el usuario: ${email} | person: ${person.id} - ${error.message}`, 'CreateUserUseCase');
        return useReject(new Error(this.DefaultError));
      }

      // create workspace member;
      try {
        await this.workspaceMemberService.add(
          workspace.id,
          person.id,
          GlobalRoleMemberType.Internal
        );
      }
      catch (error) {
        SimpleLogger.warning(`No se pudo asociar a la Persona (ref. ${email}) al workspace: ${workspace.id} | person: ${person.id} - ${error.message}`, 'CreateUserUseCase');
        return useReject(new Error(this.DefaultError));
      }

      // create company;
      let company: Company;
      try {
        company = await this.companyService.add(
          person.id,
          workspace.id,
          GlobalRoleMemberType.Internal
        );
      }
      catch (error) {
        SimpleLogger.warning(`No se pudo crear la "company" para el usuario: ${email} | person: ${person.id} | workspace: ${workspace.id} - ${error.message}`, 'CreateUserUseCase');
        return useReject(new Error(this.DefaultError));
      }

      // create project;
      try {
        await this.projectService.add(
          company.id,
          workspace.id,
          [person.name, person.lastname, 'Project', `${workspace.id}`],
          [`${person.name[0]}`, `${person.lastname[0]}`, 'P', `${workspace.id}`],
          GlobalVisibilityType.Internal,
        );
      }
      catch (error) {
        SimpleLogger.warning(`No se pudo crear el proyecto para el usuario: ${email} | workspace: ${workspace.id} | company: ${company.id} - ${error.message}`, 'CreateUserUseCase');
        return useReject(new Error(this.DefaultError));
      }

      // create user role;
      try {
        await this.roleService.setUserAsAdmin(user.id);
      }
      catch (error) {
        SimpleLogger.warning(`No se pudo crear el User Role para el usuario: ${email} | role: ADMIN - ${error.message}`, 'CreateUserUseCase');
        return useReject(new Error(this.DefaultError));
      }

      // TODO enviar email de verificación aquí

      return useResolve();
    }
    catch (error) {
      return useReject(error);
    }
  }

}

