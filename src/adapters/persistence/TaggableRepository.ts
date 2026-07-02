import { Taggable } from '../../core/domain/Taggable';
import { jsonString } from '../../core/helpers/functions/Json';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class TaggableRepository extends Repository<Taggable> {

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

