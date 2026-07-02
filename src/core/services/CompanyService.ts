import { CompanyRepository } from '../../adapters/persistence/CompanyRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Company } from '../domain/Company';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class CompanyService {

  private companyRepository: CompanyRepository = new CompanyRepository();

  constructor() { }

  async add(personId: number, workspaceId: number, companyType: string): Promise<Company> {
    try {
      const now = Date.now();

      let model = new Company();
      model.personId = personId;
      model.workspaceId = workspaceId;
      model.companyType = companyType;
      model.uid = Security.getRandomGUID();
      model.status = GlobalStatus.Active;
      model.createdAt = now;
      model.updatedAt = now;

      model = await this.companyRepository.save(model, true);

      return useResolve(model);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

