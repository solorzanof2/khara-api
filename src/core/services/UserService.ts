import { UserRepository } from '../../adapters/persistence/UserRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { User } from '../domain/User';
import { jsonString } from '../helpers/functions/Json';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class UserService {

  private userRepository: UserRepository = new UserRepository();

  constructor() { }

  async add(username: string, email: string, password: string): Promise<User> {
    try {
      const now = Date.now();

      let model = new User();
      model.uid = Security.getRandomGUID();
      model.status = GlobalStatus.Active;
      model.createdAt = now;
      model.updatedAt = now;
      model.password = Security.getPasswordHash(password);
      model.email = email;
      model.username = username;
      model.attributes = jsonString({});

      model = await this.userRepository.save(model, true);

      return useResolve(model);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

