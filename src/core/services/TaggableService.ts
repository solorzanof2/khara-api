import { TaggableRepository } from '../../adapters/persistence/TaggableRepository';
import { Security } from '../../deepcore/application/utils/Security';
import { PostDataDTO } from '../contracts/datatransfers/PostDataDTO';
import { Tag } from '../domain/Tag';
import { Taggable } from '../domain/Taggable';
import { useReject } from '../helpers/functions/Promises';

export class TaggableService {

  private taggableRepository: TaggableRepository = new TaggableRepository();

  constructor() { }

  async create(postDataDTO: PostDataDTO, parentId: number): Promise<any> {
    try {
      const now = Date.now();

      let entity = new Taggable();
      const collection: Taggable[] = new Array<Taggable>();
      let tag: Tag;
      for (tag of postDataDTO.hashtagEntities) {
        entity.uid = Security.getRandomGUID();
        entity.createdAt = now;
        entity.updatedAt = now;
        entity.tagId = tag.id;
        entity.parentId = parentId;
        entity.userId = postDataDTO.userId;

        collection.push(entity);

        entity = new Taggable();
      }

      entity = new Taggable();
      for (tag of postDataDTO.mentionEntities) {
        entity.uid = Security.getRandomGUID();
        entity.createdAt = now;
        entity.updatedAt = now;
        entity.tagId = tag.id;
        entity.parentId = parentId;
        entity.userId = postDataDTO.userId;

        collection.push(entity);

        entity = new Taggable();
      }

      for (entity of collection) {
        await this.taggableRepository.save(entity);
      }
    }
    catch (error) {
      return useReject(error);
    }
  }

}

