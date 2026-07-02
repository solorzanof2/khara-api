import { GlobalParentType, GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { GlobalMention } from '../../core/domain/GlobalMention';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class GlobalMentionRepository extends Repository<GlobalMention> {

  constructor() {
    super(GlobalMention);
  }

  async findByUserIdAndStatusActive(value: number): Promise<GlobalMention> {
    try {
      const select = this.selectQuery;

      select
        .equals('parentId', `${value}`).and()
        .equals('parentType', GlobalParentType.User).and()
        .equals('status', GlobalStatus.Active)
        .limit(1);

      const [row] = await this.execute(select);

      if (!row?.id) {
        return useResolve(new GlobalMention());
      }

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findAllByIdIn(values: number[] = []): Promise<GlobalMention[]> {
    try {
      const select = this.selectQuery;

      const parentIdsCollection = values.map(value => `${value}`);

      select
        .in('id', parentIdsCollection).and()
        .equals('parentType', GlobalParentType.User);

      const rows = await this.execute(select);

      if (!rows?.length) {
        return useResolve(new Array<GlobalMention>());
      }

      return useResolve(rows);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

