import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { Partition } from '../../core/commons/constants/Partitions';
import { InsightComment } from '../../core/domain/InsightComment';
import { InsightCount, PostInsight } from '../../core/domain/PostInsight';
import { jsonParse } from '../../core/helpers/functions/Json';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class PostInsightRepository extends Repository<PostInsight> {

  constructor() {
    super(PostInsight);

    this.inverseJoin({
      property: 'comments',
      mappedBy: 'parentId',
      target: InsightComment,
      // joinType: 'INNER',
    });
  }

  async findByUid(value: string): Promise<PostInsight> {
    try {
      this.selectQuery
        .equals('uid', value)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new PostInsight());
      }

      const [row] = rows;

      row.attributes = jsonParse(row.attributes);

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByParentId(value: number): Promise<PostInsight[]> {
    try {
      this.mapAllRelations();

      this.selectQuery
        .equals('parentId', `${value}`).and()
        .notEquals('status', GlobalStatus.Deleted);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Array<PostInsight>());
      }

      let row: PostInsight;

      for (row of rows) {
        row.attributes = jsonParse(row.attributes);
      }

      return useResolve(rows);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async countByParentIdIn(values: number[]): Promise<InsightCount[]> {
    try {
      const questionMarks = values.map(() => '?').join(', ');

      const query = [
        'SELECT `t0`.parentId, COUNT(`t0`.parentId) as total',
        'FROM `' + Partition.PostInsight + '` `t0`',
        'WHERE `t0`.parentId IN (' + questionMarks + ')',
        'GROUP BY `t0`.parentId',
      ];

      const rows = await this.queryBySql<InsightCount[]>(query.join(' '), values.map(value => `${value}`));

      if (!rows?.length) {
        return useResolve(new Array<InsightCount>());
      }

      const collection = new Array<InsightCount>();
      let row: any;

      for (row of rows) {
        collection.push({
          parentId: row.parentId,
          total: row.total,
        });
      }

      return useResolve(collection);
    }
    catch (error) {
      return useReject(error);
    }
  }

}

