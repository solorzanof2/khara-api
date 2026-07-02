import { PersonRepository } from '../../adapters/persistence/PersonRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Person } from '../domain/Person';
import { jsonString } from '../helpers/functions/Json';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class PersonService {

  private personRepository: PersonRepository = new PersonRepository();

  constructor() { }

  async add(name: string, lastname: string, userId: number, personType: string): Promise<Person> {
    try {
      const now = Date.now();

      let model = new Person();
      model.uid = Security.getRandomGUID();
      model.status = GlobalStatus.Active;
      model.createdAt = now;
      model.updatedAt = now;
      model.userId = userId;
      model.name = name;
      model.lastname = lastname;
      model.attributes = jsonString({});
      model.personType = personType;
      model.attachments = jsonString({});

      model = await this.personRepository.save(model, true);

      return useResolve(model);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

