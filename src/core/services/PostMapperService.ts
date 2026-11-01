import { load } from 'cheerio';
import { SimpleLogger } from '../../deepcore/application/helpers/SimpleLogger';
import { PostDataDTO } from '../contracts/datatransfers/PostDataDTO';
import { Tag } from '../domain/Tag';
import { useReject, useResolve } from '../helpers/functions/Promises';
import { TagService } from './TagService';


export class PostMapperService {

  private readonly TagsRegexp = /(?<![\w@])[@#][\w_-]+/g;

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
      model.userId = userId;

      const $ = load(value, undefined, false);
      const textNodes = $('*').add($.root()).contents().toArray().filter(node =>
        node.type === 'text' && !$(node).parents('a, code, pre, script, style').length
      );
      const links = new Map<string, string>();
      for (const node of textNodes) {
        if (node.type !== 'text') {
          continue;
        }
        for (const current of node.data.match(this.TagsRegexp) || []) {
          if (links.has(current)) {
            continue;
          }
          const rawText = current.slice(1);
          const isMention = current.startsWith('@');
          const tagModel: Tag = await this.tagService.getByNameAndUpdateUsage(
            rawText, userId, isMention ? TagService.CategoryMention : TagService.CategoryHashtag
          );
          links.set(current, tagModel.link);
          if (isMention) {
            model.mentions.push(rawText);
            model.mentionEntities.push(tagModel);
          }
          else {
            model.hashtags.push(rawText);
            model.hashtagEntities.push(tagModel);
          }
        }
      }

      for (const node of textNodes) {
        if (node.type !== 'text' || !node.data.match(this.TagsRegexp)) {
          continue;
        }
        const escaped = node.data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        $(node).replaceWith(escaped.replace(this.TagsRegexp, match => links.get(match) || match));
      }
      model.post = $.html();

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

