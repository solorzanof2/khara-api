import { QueryManager } from './core/QueryManager';
import { ColumnType, FetchType, JoinType } from './interfaces/JoinMappers';
import { Model } from './models/Model';


export class Repository<T extends Model> extends QueryManager<T> {

  get tablename(): string {
    return this.model.tablename;
  }

  get queryTablename(): string {
    return "`%s`".replace('%s', this.tablename);
  }

  constructor(model: any) {
    super(model);
  }

  async findById(value: number): Promise<T> {
    try {
      this.selectQuery
        .safeAnd()
        .equals(QueryManager.ColumnID, `${value}`);

      const results = await this.query<T>(this.selectQuery);

      const [model] = this.dataMapper(results);

      return Promise.resolve(model);
    }
    catch (error) {
      return Promise.reject(error);
    }
    finally {
      this.resetQuery();
    }
  }

  async findAll(): Promise<T[]> {
    try {
      const results = await this.query<T>(this.selectQuery);
      return Promise.resolve(this.dataMapper(results));
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  async count(): Promise<number> {
    try {
      const query = [
        "SELECT COUNT(`t0`.id) AS total",
        "FROM",
        "`"+this.tablename+"`",
        "`t0`"
      ].join(' ');

      const [totalRows] = await this.queryBySql<any>(query);

      if (!totalRows?.total) {
        return Promise.resolve(0);
      }

      return Promise.resolve(totalRows.total);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  async save(model: T, getLastInserted: boolean = false): Promise<T> {
    try {
      let result = {} as StatementResult;

      // is update
      if (model.id) {
        const query = this.update();

        for (const field of this.fieldsCollection) {
          if (field === QueryManager.ColumnID) {
            continue;
          }

          query.set(field, `${model[field as keyof Model]}`);
        }

        query.equals(QueryManager.ColumnID, `${model.id}`);

        result = await this.database.prepare(query) as StatementResult;
        if (!result.affectedRows) {
          throw new Error(`Something went wrong when try to update register with id: ${model.id}.`);
        }

        if (!getLastInserted) {
          return Promise.resolve({} as T);
        }

        return Promise.resolve(await this.findById(model.id));
      }

      // is save
      const insert = this.insert();

      const collection = new Array<string>();
      const values = new Array<string>();

      let value;
      for (const field of this.fieldsCollection) {
        value = model[field as keyof Model];
        if (!value) {
          continue;
        }

        collection.push(field);
        values.push(value.toString());
      }

      insert.fields(collection);
      insert.values(values);

      result = await this.database.prepare(insert) as StatementResult;
      if (!result.affectedRows) {
        throw new Error(`Something went wrong when try to insert the data.`);
      }

      if (!getLastInserted) {
        return Promise.resolve({} as T);
      }

      const lastInserted = await this.findById(result.insertId);

      lastInserted.id = result.insertId;

      return Promise.resolve(lastInserted);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  async deleteById(value: number): Promise<void> {
    try {
      const query = this.delete()
        .equals(QueryManager.ColumnID, `${value}`);

      const result = await this.database.prepare(query);
      if (!result.affectedRows) {
        throw new Error(`Something went wrong when try to delete the register with id ${value}.`);
      }

      return Promise.resolve();
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  protected mapFieldLike(value: string): string {
    return `LOWER(${value}) LIKE CONCAT('%', ?, '%')`;
  }

  protected extract(value: string): any {
    return JSON.parse(value);
  }

  protected async countByQuery(value: string, parameters?: string[]): Promise<number> {
    try {
      const [totalRows] = await this.queryBySql<any>(value, parameters);

      if (!totalRows?.total) {
        return Promise.resolve(0);
      }

      return Promise.resolve(totalRows.total);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

}

interface StatementResult {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  serverStatus: number;
  warningCount: number;
  message: string;
  protocol41: boolean;
  changedRows: number;
}
// {
//   "fieldCount": 0,
//   "affectedRows": 1,
//   "insertId": 4,
//   "serverStatus": 2,
//   "warningCount": 0,
//   "message": "",
//   "protocol41": true,
//   "changedRows": 0
// }

// {
//   "fieldCount": 0,
//   "affectedRows": 1,
//   "insertId": 0,
//   "serverStatus": 2,
//   "warningCount": 0,
//   "message": "(Rows matched: 1  Changed: 1  Warnings: 0",
//   "protocol41": true,
//   "changedRows": 1
// }

export interface JoinOptions {
  property: string;
  target: any;
  fieldName?: string;
  type?: ColumnType;
  fetchType?: FetchType;
  updatable?: boolean;
  joinType?: JoinType;
  joinTablename?: string;
  joinColumn?: string;
  inverseJoin?: string;
  mappedBy?: string;
  orphanRemoval?: boolean;
}

export interface WhereOptions {
  tablename: string;
  fieldFK: string;
  foreignTablename: string;
  foreignFieldPK: string;
}