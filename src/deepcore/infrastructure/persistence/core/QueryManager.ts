// import { DatabaseFactory } from '../DatabaseFactory';
import { Field } from '../interfaces/Field';
import { Column, JoinColumn, JoinInverse, JoinTable } from '../interfaces/JoinMappers';
import { QueryBuilder } from '../interfaces/QueryBuilder';
import { Model } from '../models/Model';
import { MySQLClient } from '../MySQLClient';
import { Delete } from '../queries/Delete';
import { Insert } from '../queries/Insert';
import { Select } from '../queries/Select';
import { Update } from '../queries/Update';
import { JoinOptions } from '../Repository';


export abstract class QueryManager<T extends Model> {
  static readonly ColumnID = 'id';

  protected model: T;
  protected modelClass;

  // protected database: DatabaseFactory;
  protected database: MySQLClient;
  protected fieldsCollection: string[];
  protected protectedFields: string[] = [
    'tablename', 'relations', 'isPresent',
  ];

  protected selectQuery!: Select;

  protected joinColumnsCollection: JoinColumn[];
  protected joinTablesCollection: JoinTable[];
  protected joinInversesCollection: JoinInverse[];

  protected get hasJoinColumns(): boolean {
    return (this.joinColumnsCollection.length > 0);
  }

  protected get hasJoinTables(): boolean {
    return (this.joinTablesCollection.length > 0);
  }

  protected get hasInverseJoins(): boolean {
    return (this.joinInversesCollection.length > 0);
  }

  abstract get tablename(): string;

  constructor(model: any) {
    this.model = new model();
    this.modelClass = model;
    this.database = MySQLClient.getInstance();
    this.fieldsCollection = this.mapFieldsFromModel(this.model);

    this.joinColumnsCollection = new Array<JoinColumn>();
    this.joinTablesCollection = new Array<JoinTable>();
    this.joinInversesCollection = new Array<JoinInverse>();

    this.configureSelect();
  }

  protected configureSelect(): void {
    this.selectQuery = Select.getInstance(this.fieldsCollection).from(this.tablename);
  }

  protected insert(): Insert {
    const query = new Insert();
    return query.into(this.tablename);
  }

  protected update(): Update {
    const query = new Update(this.tablename);
    return query;
  }

  protected delete(): Delete {
    const query = new Delete();
    query.disableAlias();
    return query.from(this.tablename);
  }

  protected joinColumn(options: JoinOptions): void {
    const instance = new options.target();

    const join = {
      property: options.property,
      fieldName: options.fieldName,
      type: options.type || 'class',
      fetchType: options.fetchType || 'EAGER',
      target: {
        instance,
        tablename: instance.tablename,
        fields: this.mapFieldsFromModel(instance),
        targetClass: options.target,
      },
      updatable: options.updatable || false,
      joinType: options.joinType || 'INNER',
    } as JoinColumn;

    this.joinColumnsCollection.push(join);
  }

  protected joinTable(options: JoinOptions): void {
    const instance = new options.target();

    const join = {
      property: options.property,
      joinTablename: options.joinTablename,
      joinColumn: options.joinColumn,
      inverseJoin: options.inverseJoin,
      fetchType: options.fetchType || 'EAGER',
      type: options.type || 'collection',
      target: {
        instance,
        tablename: instance.tablename,
        fields: this.mapFieldsFromModel(instance),
        targetClass: options.target,
      },
    } as JoinTable;

    this.joinTablesCollection.push(join);
  }

  protected inverseJoin(options: JoinOptions): void {
    const instance = new options.target();

    const join = {
      property: options.property,
      mappedBy: options.mappedBy,
      type: options.type || 'collection',
      fetchType: options.fetchType || 'EAGER',
      target: {
        instance,
        tablename: instance.tablename,
        fields: this.mapFieldsFromModel(instance),
        targetClass: options.target,
      },
      orphanRemoval: options.orphanRemoval || true,
      joinType: options.joinType || 'LEFT',
    } as JoinInverse;

    this.joinInversesCollection.push(join);
  }

  protected resetQuery(): void {
    this.configureSelect();
  }

  protected mapJoins(): void {
    if (!this.hasJoinColumns) {
      return;
    }

    for (const join of this.joinColumnsCollection) {
      if (join.fetchType === 'LAZY') {
        continue;
      }

      this.selectQuery
        .select(join.target.fields)
        .from(join.target.tablename);

      if (join.joinType === 'LEFT') {
        this.selectQuery.leftJoin(join.target.tablename, QueryManager.ColumnID, this.tablename, join.fieldName);
        continue;
      }

      this.selectQuery.innerJoin(join.target.tablename, QueryManager.ColumnID, this.tablename, join.fieldName);
    }
  }

  protected mapJoinTables(): void {
    if (!this.hasJoinTables) {
      return;
    }

    for (const join of this.joinTablesCollection) {
      if (join.fetchType === 'LAZY') {
        continue;
      }

      this.selectQuery
        .select([join.joinColumn, join.inverseJoin])
        .from(join.joinTablename)
        .select(join.target.fields)
        .from(join.target.tablename)
        .leftJoin(join.joinTablename, join.joinColumn, this.tablename, QueryManager.ColumnID)
        .leftJoin(join.target.tablename, QueryManager.ColumnID, join.joinTablename, join.inverseJoin);
    }
  }

  protected mapInverseJoins(): void {
    if (!this.hasInverseJoins) {
      return;
    }

    for (const join of this.joinInversesCollection) {
      this.selectQuery
        .select(join.target.fields)
        .from(join.target.tablename)
        .leftJoin(join.target.tablename, join.mappedBy, this.tablename, QueryManager.ColumnID);
    }
  }

  protected mapAllRelations(): void {
    this.mapJoins();
    this.mapJoinTables();
    this.mapInverseJoins();
  }

  protected dataMapper(rowsCollection: any[] = []): T[] {
    const result = new Array<T>();

    let model: T;
    let isPresent = false;
    for (const row of rowsCollection) {
      model = result.find(x => x.id === row.t0_id) as T;
      if (!model) {
        model = this.mapDataModel(this.modelClass, row, this.fieldsCollection, this.tablename);
        model = this.mapDataJoins(this.hasJoinColumns, this.joinColumnsCollection, model, row);
        isPresent = false;
      }
      else {
        isPresent = true;
      }

      model = this.mapDataJoins(this.hasJoinTables, this.joinTablesCollection, model, row);
      model = this.mapDataJoins(this.hasInverseJoins, this.joinInversesCollection, model, row)

      if (!isPresent) {
        result.push(model);
      }
    }

    return result;
  }

  private mapDataJoins(hasJoins: boolean, joinsCollection: Column[], model: any, row: any) {
    if (!hasJoins) {
      return model;
    }

    let joinModel;
    for (const join of joinsCollection) {
      if (join.fetchType === 'LAZY') {
        continue;
      }

      joinModel = this.mapDataModel(join.target.targetClass, row, join.target.fields, join.target.tablename);
      if (!joinModel.id) {
        continue;
      }

      if (join.type === 'class') {
        model[join.property] = joinModel;
        continue;
      }

      if (!model[join.property]) {
        model[join.property] = [];
      }

      model[join.property].push(joinModel);
    }

    return model;
  }

  private mapDataModel(target: any, row: any, fieldsCollection: string[], tablename: string) {
    let queryField: Field;
    let model = new target();
    for (const field of fieldsCollection) {
      queryField = this.selectQuery.getFieldByName(field, tablename);
      if (!queryField) {
        continue;
      }
      model[field] = row[queryField.alias];
    }
    // model.isPresent = true;

    return model;
  }

  private mapFieldsFromModel(model: Model): string[] {
    const fieldsCollection = new Array<string>();
    for (const field in model) {
      switch (true) {
        case (this.protectedFields.includes(field)):
        case (model.relations.includes(field)):
        case (typeof model[field as keyof Model] === 'object'):
          continue;
      }

      fieldsCollection.push(field);
    }
    return fieldsCollection;
  }

  async query<TK>(builder: QueryBuilder): Promise<TK[]> {
    try {
      if (builder.queryType === 'SELECT') {
        this.validateSelectQuery(builder.build().query);
      }

      return <unknown>this.database.prepare(builder) as TK[];
    }
    catch (error) {
      return Promise.reject(error);
    }
    finally {
      this.resetQuery();
    }
  }

  async queryBySql<TK>(value: string, parameters: string[] = []): Promise<TK> {
    try {
      if (value.startsWith('SELECT')) {
        this.validateSelectQuery(value);
      }

      if (parameters.length) {
        return this.database.execute(value, parameters, true);
      }

      return this.database.plainExecute(value, true);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  async execute(builder: QueryBuilder): Promise<T[]> {
    try {
      if (builder.queryType === 'SELECT') {
        this.validateSelectQuery(builder.build().query);
      }

      const results = await this.database.prepare(builder) as any[];

      return Promise.resolve(this.dataMapper(results));
    }
    catch (error) {
      return Promise.reject(error);
    }
    finally {
      this.resetQuery();
    }
  }

  private validateSelectQuery(query: string): void {
    const quote = '`';
    const tablename = `${quote}${this.tablename}${quote}`;
    if (!query.includes(`FROM ${tablename}`)) {
      throw new Error(`Wrong tablename has been provided at SELECT query.`);
    }
  }

}
