import { UserRepository } from '../../adapters/persistence/UserRepository';
import { WorkspaceRepository } from '../../adapters/persistence/WorkspaceRepository';
import { SimpleLogger } from '../../deepcore/application/helpers/SimpleLogger';
import { Security } from '../../deepcore/application/utils/Security';
import { UseCase, UseCaseOptions } from '../../deepcore/contracts/UseCase';
import { Dates } from '../helpers/DatesHelper';
import { useReject, useResolve } from '../helpers/functions/Promises';
import { LABEL } from '../helpers/LabelHelper';


export class SignInUseCase implements UseCase {

  private userRepository: UserRepository = new UserRepository();
  private workspaceRepository: WorkspaceRepository = new WorkspaceRepository();

  constructor() { }

  async execute<T>(options: UseCaseOptions): Promise<T> {
    try {
      const {
        username, password, requestId,
      } = options;

      const user = await this.userRepository.findByUsername(username);

      if (!user?.id) {
        SimpleLogger.warning(`El usuario o email: ${username} es inválido. [404] `, 'AuthenticationHandler', requestId);
        throw new Error('error.login');
      }

      if (!Security.validatePassword(password, user.password)) {
        SimpleLogger.warning(`La contraseña enviada por el usuario: ${username} es inválida.`, 'AuthenticationHandler', requestId);
        throw new Error('error.login');
      }

      const workspace = await this.workspaceRepository.findByPersonId(user.person.id);

      const token = {
        sid: user.uid,
        iat: Date.now(),
        email: user.email,
        username: user.username,
        uid: user.uid,
        fullName: `${user.person.name} ${user.person.lastname}`,
        roles: user.roles.map(role => ({ name: role.name, code: role.code, uid: role.uid })),
        // tenantUid: user.
      };

      const response = {
        token: Security.getJSONWebTokenByData(token),
        email: user.email,
        username: user.username,
        name: user.person.name,
        lastname: user.person.lastname,
        uid: user.uid,
        status: user.status,
        statusLabel: LABEL.parse(user.status),
        created: user.createdAt,
        createdLabel: Dates.millisToLocalUserDatetime(user.createdAt),
        workspace: {
          uid: workspace.uid,
          name: workspace.name,
          status: LABEL.parse(workspace.status),
          created: workspace.createdAt,
          createdLabel: Dates.millisToLocalUserDatetime(workspace.createdAt),
        },
        person: {
          uid: user.person.uid,
          status: LABEL.parse(user.person.status),
          created: user.person.createdAt,
          createdLabel: Dates.millisToLocalUserDatetime(user.person.createdAt),
        },
      };

      return useResolve(response as T);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

