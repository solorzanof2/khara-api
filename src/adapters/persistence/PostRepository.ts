import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { Partition } from '../../core/commons/constants/Partitions';
import { GlobalMention } from '../../core/domain/GlobalMention';
import { Post, PostCount } from '../../core/domain/Post';
import { jsonParse, jsonString } from '../../core/helpers/functions/Json';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';

export class PostRepository extends Repository<Post> {

  constructor() {
    super(Post);

    this.joinColumn({
      property: 'author',
      fieldName: 'authorId',
      target: GlobalMention,
      updatable: false,
      joinType: 'INNER',
    });
  }

  async findById(value: number): Promise<Post> {
    try {
      const row = await super.findById(value);

      if (!row?.id) {
        return useResolve(new Post());
      }

      row.attributes = jsonParse(row.attributes);

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findByUid(value: string): Promise<Post> {
    try {
      this.selectQuery
        .equals('uid', value)
        .limit(1);

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Post());
      }

      const [row] = rows;

      row.attributes = jsonParse(row.attributes);

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async save(model: Post, getLastInserted: boolean = false): Promise<Post> {
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

  async findAllPaginated(offset: number, limit: number = 10): Promise<Post[]> {
    try {
      this.selectQuery
        .paginate(offset, limit)
        .orderByDesc('id');

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Array<Post>());
      }

      let row: Post;
      for (row of rows) {
        row.attributes = jsonParse(row.attributes);
      }

      await this.loadChildren(rows);
      return useResolve(rows);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async countByProjectIdAndStatusActive(value: number): Promise<number> {
    try {
      const queryBuilder = [
        "SELECT COUNT(`t0`.id) AS total",
        "FROM `posts` `t0`",
        "WHERE `t0`.projectId = ?",
        "AND `t0`.status = ?"
      ];

      const params = [
        `${value}`,
        GlobalStatus.Active,
      ];

      const total = await super.countByQuery(queryBuilder.join(' '), params);

      return useResolve(total);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findAllPaginatedByProjectIdAndStatusActive(value: number, offset: number, limit: number = 10): Promise<Post[]> {
    try {
      this.mapAllRelations();

      this.selectQuery
        .equals('projectId', `${value}`).and()
        .equals('status', GlobalStatus.Active)
        .paginate(offset, limit)
        .orderByDesc('id');

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Array<Post>());
      }

      let row: Post;
      for (row of rows) {
        row.attributes = jsonParse(row.attributes);
      }

      await this.loadChildren(rows);
      return useResolve(rows);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findFullPostByUidAndStatusActive(value: string): Promise<Post> {
    try {
      this.mapAllRelations();

      this.selectQuery
        .equals('uid', value, 0).and()
        .equals('status', GlobalStatus.Active);

      const [row] = await this.execute(this.selectQuery);

      if (!row?.id) {
        return useResolve(new Post());
      }

      row.attributes = jsonParse(row.attributes);
      await this.loadChildren([row]);

      return useResolve(row);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async findAllPaginatedByUserIdAndStatusActive(value: number, offset: number, limit: number = 10): Promise<Post[]> {
    try {
      this.mapAllRelations();

      this.selectQuery
        .equals('userId', `${value}`).and()
        .equals('status', GlobalStatus.Active)
        .paginate(offset, limit)
        .orderByDesc('id');

      const rows = await this.execute(this.selectQuery);

      if (!rows?.length) {
        return useResolve(new Array<Post>());
      }

      let row: Post;
      for (row of rows) {
        row.attributes = jsonParse(row.attributes);
      }

      await this.loadChildren(rows);
      return useResolve(rows);
    }
    catch (error) {
      return useReject(error);
    }
  }

  async countByUserIdAndStatusActive(value: number): Promise<number> {
    try {
      const queryBuilder = [
        "SELECT COUNT(`t0`.id) AS total",
        "FROM `" + Partition.Posts + "` `t0`",
        "WHERE `t0`.userId = ?",
        "AND `t0`.status = ?"
      ];

      const params = [
        `${value}`,
        GlobalStatus.Active,
      ];

      const total = await super.countByQuery(queryBuilder.join(' '), params);

      return useResolve(total);
    }
    catch (error) {
      return useReject(error);
    }
  }

  // Load children separately: the generic ORM resolves relations by table name and
  // cannot distinguish both sides of a self join. This also preserves pagination.
  private async loadChildren(posts: Post[]): Promise<void> {
    if (!posts.length) return;
    const children = await this.queryBySql<Post[]>(
      'SELECT * FROM `posts` WHERE parentId IN (' + posts.map(() => '?').join(', ') + ') AND status = ? ORDER BY id',
      [...posts.map(post => String(post.id)), GlobalStatus.Active],
    );
    for (const post of posts) {
      post.postsCollection = children.filter(child => child.parentId === post.id)
        .map(child => Object.assign(new Post(), child, { attributes: jsonParse(child.attributes) }));
    }
  }

  async countByParentIdIn(values: number[]): Promise<PostCount[]> {
    try {
      if (!values.length) return [];
      const questionMarks = values.map(() => '?').join(', ');

      const query = [
        'SELECT `t0`.parentId, COUNT(`t0`.parentId) as total',
        'FROM `' + Partition.Posts + '` `t0`',
        'WHERE `t0`.parentId IN (' + questionMarks + ') AND `t0`.status = ?',
        'GROUP BY `t0`.parentId',
      ];

      const rows = await this.queryBySql<PostCount[]>(query.join(' '), [...values.map(value => `${value}`), GlobalStatus.Active]);

      if (!rows?.length) {
        return useResolve(new Array<PostCount>());
      }

      const collection = new Array<PostCount>();
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

