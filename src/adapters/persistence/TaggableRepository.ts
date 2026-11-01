import { Taggable } from '../../core/domain/Taggable';
import { jsonString } from '../../core/helpers/functions/Json';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class TaggableRepository extends Repository<Taggable> {

  async deleteByParentIdAndParentType(parentId: number, parentType: string): Promise<void> {
    const query = this.delete().equals('parentId', String(parentId)).and().equals('parentType', parentType);
    await this.database.prepare(query);
  }

  constructor() {
    super(Taggable);
  }

  async save(model: Taggable, getLastInserted: boolean = false): Promise<Taggable> {
    try {
      if (!model.attributes) {
        model.attributes = {};
      }

      model.attributes = jsonString(model.attributes);

      if (getLastInserted) {
        return useResolve(await super.save(model, getLastInserted));
      }

      return useResolve(await super.save(model));
    }
    catch (error) {
      return useReject(error);
    }
  }

}

