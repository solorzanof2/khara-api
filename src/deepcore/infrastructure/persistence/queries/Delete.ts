import { QueryBuilder } from '../interfaces/QueryBuilder';
import { Conditions } from './Conditions';
import { QueryResult } from './QueryResult';
import { Table } from './Table';


export class Delete extends Conditions implements QueryBuilder {

  clause = 'DELETE';

  get table(): Table {
    return this.tables[0];
  }

  get queryType(): string {
    return this.clause;
  }

  constructor() {
    super();
    this.tables = [new Table(['*'])];
  }

  build(): QueryResult {
    const builder = [this.clause];

    builder.push(`FROM ${this.table.name}`);

    const conditions = [];
    const values = [];

    if (this.table.hasConditions()) {
      let { sql, parameters } = this.table.getConditions();
      conditions.push(sql);

      if (parameters) {
        for (const value of parameters) {
          values.push(value);
        }
      }
    }

    if (conditions.length) {
      builder.push(`WHERE ${conditions.join(Conditions.SpaceSeparator)}`);
    }

    return new QueryResult(builder, values);
  }

}