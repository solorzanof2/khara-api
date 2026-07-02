import { TagRepository } from '../../adapters/persistence/TagRepository';
import { SimpleLogger } from '../../deepcore/application/helpers/SimpleLogger';
import { Tag } from '../domain/Tag';
import { useReject, useResolve } from '../helpers/functions/Promises';


export class TagService {

  static readonly CategoryHashtag = 'hashtag';
  static readonly CategoryMention = 'mention';
  readonly PathHashtag = 'hashtags';
  readonly PathMention = 'mentions';

  private tagRepository: TagRepository = new TagRepository();

  constructor() { }

  async getByNameAndUpdateUsage(value: string, userId: number, type: string = TagService.CategoryMention): Promise<Tag> {
    try {
      if (!value) {
        SimpleLogger.warning(`Intento de lectura de tag de tipo: ${type} sin un nombre definido.`, 'TagService');
        return useReject('Error al leer un tag de tipo: ${type} en blanco');
      }

      let tag = await this.tagRepository.findByNameAndCategoryAndUserId(value, type, userId);
      if (tag.id) {
        tag.usageCount += 1;
        await this.updateUsageById(tag.usageCount, tag.id);

        return useResolve(tag);
      }

      tag.name = value;
      tag.category = type;
      tag.link = this.buildLinkByName(value, type);
      tag.userId = userId;
      tag.usageCount = 1;

      tag = await this.tagRepository.save(tag, true);

      return useResolve(tag);
    }
    catch (error) {
      return useReject(error);
    }
  }

  private buildLinkByName(value: string, type: string): string {
    const isMention = (type === TagService.CategoryMention);

    let symbol = '#';
    let cssClass = 'post-hashtag';

    if (isMention) {
      symbol = '@';
      cssClass = 'post-mention';
    }

    const builder = [
      `<a href="${this.buildHrefByName(value, isMention)}" `,
      `tag-link="true" font-bold="true" class="post-link ${cssClass}">`,
      `${symbol}${value}`,
      `</a>`,
    ];

    return builder.join('');
  }

  private buildHrefByName(value: string, isMention: boolean): string {
    let path = this.PathHashtag;
    if (isMention) {
      path = this.PathMention;
    }

    return `webapp/explore/${path}/${value}`;
  }

  async updateUsageById(value: number, id: number): Promise<any> {
    try {
      if (!value) {
        SimpleLogger.warning(`No se detectó un valor de Usage Count para actualizar el TAG`, 'TagService');
        return useReject(new Error('El UID del Tag es inválido.'));
      }

      if (!id) {
        SimpleLogger.warning(`No se detectó un ID para actualizar el TAG`, 'TagService');
        return useReject(new Error('El UserID del Tag es inválido.'));
      }

      await this.tagRepository.updateUsageById(value, id);

      return useResolve();
    }
    catch (error) {
      return useReject(error);
    }
  }

}

