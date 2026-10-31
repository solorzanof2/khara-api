// import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { GlobalStatus } from '../../core/commons/constants/GlobalConstants';
import { GlobalMention } from '../../core/domain/GlobalMention';
import { Post } from '../../core/domain/Post';
import { PostComment } from '../../core/domain/PostComment';
// import { PostInsight } from '../../core/domain/PostInsight';
import { jsonParse, jsonString } from '../../core/helpers/functions/Json';
import { useReject, useResolve } from '../../core/helpers/functions/Promises';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class PostRepository extends Repository<Post> {

  constructor() {
    super(Post);

    // this.joinColumn({
    //   property: 'file',
    //   fieldName: 'fileId',
    //   target: File,
    //   updatable: false,
    //   joinType: 'INNER',
    // });

    this.inverseJoin({
      property: 'comments',
      mappedBy: 'parentId',
      target: PostComment,
      // joinType: 'INNER',
    });

    // this.inverseJoin({
    //   property: 'insights',
    //   mappedBy: 'parentId',
    //   target: PostInsight,
    //   // joinType: 'INNER',
    // });

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

      return useResolve();
    }
    catch (error) {
      return useReject(error);
    }
  }

  // async findAllPaginated(offset: number, limit: number = 10): Promise<Post[]> {
  //   try {
  //     this.mapAllRelations();

  //     this.selectQuery
  //       .paginate(offset, limit)
  //       .orderByDesc('id');

  //     const rows = await this.execute(this.selectQuery);

  //     if (!rows?.length) {
  //       return Promise.resolve(new Array<Post>());
  //     }

  //     let row: Post;
  //     for (row of rows) {
  //       row.attachments = this.extract(row.attachments);
  //       row.attributes = this.extract(row.attributes);
  //       row.location = this.extract(row.location);
  //     }

  //     return Promise.resolve(rows);
  //   }
  //   catch (error) {
  //     return Promise.reject(error);
  //   }
  // }

  // async findAllPaginatedByStatusComingOrActive(offset: number, limit: number = 10): Promise<Post[]> {
  //   try {
  //     this.mapAllRelations();

  //     this.selectQuery
  //       .in('status', [GlobalStatus.Active, GlobalStatus.Coming])
  //       .paginate(offset, limit)
  //       .orderByDesc('id');

  //     const rows = await this.execute(this.selectQuery);

  //     if (!rows?.length) {
  //       return Promise.resolve(new Array<Post>());
  //     }

  //     let row: Post;
  //     for (row of rows) {
  //       row.attachments = this.extract(row.attachments);
  //       row.attributes = this.extract(row.attributes);
  //       row.location = this.extract(row.location);
  //     }

  //     return Promise.resolve(rows);
  //   }
  //   catch (error) {
  //     return Promise.reject(error);
  //   }
  // }

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
        // .limit(1);

      const [row] = await this.execute(this.selectQuery);

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
        "FROM `posts` `t0`",
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

}

