import { Tag } from '../../core/domain/Tag';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { SimpleLogger } from '../../deepcore/application/helpers/SimpleLogger';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class TagRepository extends Repository<Tag> {

  constructor() {
    super(Tag);
  }

  async findByNameAndCategoryAndUserId(value: string, category: string, userId: number): Promise<Tag> {
    try {
      this.selectQuery
        .equals('name', value).and()
        .equals('category', category).and()
        .equals('userId', `${userId}`)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Tag());
      }

      return useResolve(rows[0]);
    }
    catch (error) {
      SimpleLogger.error(`Error de lectura: ${error.message}`, 'TagRepository.findByNameAndCategoryAndUserId');
      return useReject(error);
    }
  }

  async updateUsageById(value: number, id: number): Promise<void> {
    try {
      const updateQuery = this.update()
        .setFromObject({
          usageCount: value,
        })
        .equals('id', `${id}`);

      await this.query<void>(updateQuery);

      return useResolve();
    }
    catch (error) {
      SimpleLogger.error(`Error de lectura: ${error.message}`, 'TagRepository.updateUsageByUidAndUserId');
      return useReject(error);
    }
  }

}

