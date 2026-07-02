import { SimpleLogger } from '../../deepcore/application/helpers/SimpleLogger';
import { PostDataDTO } from '../contracts/datatransfers/PostDataDTO';
import { Tag } from '../domain/Tag';
import { useReject, useResolve } from '../helpers/functions/Promises';
import { TagService } from './TagService';


export class PostMapperService {

  private readonly TagsRegexp = /([@#][\w_-]+)/gmi;

  private tagService: TagService = new TagService();

  constructor() { }

  async parse(value: string = '', userId: number): Promise<PostDataDTO> {
    try {
      if (!value) {
        SimpleLogger.warning('Se detectó un intento de publicación vacía.', 'PostMapperService');
        return useReject('La publicación está vacía.');
      }

      const model = new PostDataDTO();
      model.rawPost = value;

      const tagsCollection = value.match(this.TagsRegexp);

      if (!tagsCollection?.length) {
        model.post = value;
        return useResolve(model);
      }

      let current = '';
      let rawText = '';

      let tagModel: Tag;

      for (current of tagsCollection) {
        if (current.startsWith('@')) {
          rawText = current.replace('@', '');
          model.mentions.push(rawText);

          tagModel = await this.tagService.getByNameAndUpdateUsage(rawText, userId);
          value = value.replaceAll(current, tagModel.link);

          model.mentionEntities.push(tagModel);
          continue;
        }

        if (current.startsWith('#')) {
          rawText = current.replace('#', '');
          model.hashtags.push(rawText);

          tagModel = await this.tagService.getByNameAndUpdateUsage(rawText, userId, TagService.CategoryHashtag);
          value = value.replaceAll(current, tagModel.link);

          model.hashtagEntities.push(tagModel);
          continue;
        }
      }

      // model.mentionsText = this.buildCommaStringFromArray(model.mentions);
      // model.hashtagsText = this.buildCommaStringFromArray(model.hashtags);
      model.post = value;
      model.userId = userId;

      return useResolve(model);
    }
    catch (error) {
      return useReject(error);
    }
  }

  // private buildCommaStringFromArray(value: string[]): string {
  //   return `;${value.join(';')};`;
  // }

  tagsToString(collection: string[], parentTags: string): string {

    const parentCollection = parentTags.split(';').filter(Boolean);

    const tagBuilder = new Array<string>();

    let current = '';
    for (current of parentCollection) {
      if (collection.includes(current)) {
        continue;
      }

      tagBuilder.push(`@${current}`);
    }

    return tagBuilder.join(' ');
  }

}

