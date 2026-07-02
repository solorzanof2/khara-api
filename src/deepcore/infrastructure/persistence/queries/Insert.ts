import { QueryBuilder } from '../interfaces/QueryBuilder';
import { FieldMapper } from '../mappers/FieldMapper';
import { QueryResult } from './QueryResult';


export class Insert implements QueryBuilder {

  clause = 'INSERT INTO';
  tablename = '';
  fieldsCollection = '';
  totalFields = 0;
  questionParameters = '';
  parameters: string[];

  get queryType(): string {
    return this.clause;
  }

  constructor() {
    this.tablename = '';
    this.parameters = new Array<string>();
  }

  into(tablename: string) {
    this.tablename = FieldMapper.fieldReplace(tablename);
    return this;
  }

  fields(values: string | string[]) {
    const fields = (Array.isArray(values)) ? values : [values];

    this.totalFields = fields.length;

    const collection = [];
    for (const field of fields) {
      collection.push(FieldMapper.fieldReplace(field));
    }

    this.fieldsCollection = collection.join(', ');
    return this;
  }

  values(collection: string | string[]) {
    const values = (Array.isArray(collection)) ? collection : [collection];

    const length = values.length;
    if (length > this.totalFields) {
      throw new Error(`Values cannot be major than ${this.totalFields}`);
    }

    if (length < this.totalFields) {
      throw new Error(`Values cannot be minor than ${this.totalFields}`);
    }

    let parameters = [];
    for (let index = 0; index < length; index++) {
      parameters.push('?');
    }

    this.questionParameters = parameters.join(', ');
    this.parameters = values;

    return this;
  }

  build(): QueryResult {
    const build = [this.clause];
    build.push(this.tablename);
    build.push(`(${this.fieldsCollection})`);
    build.push(`VALUES (${this.questionParameters})`);

    return new QueryResult(build, this.parameters);
  }

}
