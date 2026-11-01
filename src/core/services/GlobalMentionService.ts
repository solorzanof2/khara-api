import { GlobalMentionRepository } from '../../adapters/persistence/GlobalMentionRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { GlobalMention } from '../domain/GlobalMention';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class GlobalMentionService {

  private globalMentionRepository: GlobalMentionRepository = new GlobalMentionRepository();

  constructor() { }

  async add(username: string, displayName: string[], parentId: number, parentType: string): Promise<GlobalMention> {
    try {
      const now = Date.now();

      const model = new GlobalMention();
      model.uid = Security.getRandomGUID();
      model.createdAt = now;
      model.updatedAt = now;
      model.status = GlobalStatus.Active;
      model.parentType = parentType;
      model.parentId = parentId;
      model.mention = username;
      model.displayName = displayName.join(' ');

      return useResolve(await this.globalMentionRepository.save(model, true));
    }
    catch (error) {
      return useReject(error);
    }
  }

}

