import { QueryBuilder } from '../interfaces/QueryBuilder';
import { Conditions } from './Conditions';
import { QueryResult } from './QueryResult';


export class Select extends Conditions implements QueryBuilder {

  private clause = 'SELECT';

  get queryType(): string {
    return this.clause;
  }

  constructor(fields?: string[]) {
    super();
    this.addTable(fields || [Select.AllFields]);
  }

  static getInstance(fields?: string[]): Select {
    return new this(fields);
  }

  select(fields?: string[]) {
    this.addTable(fields);
    return this;
  }

  groupBy(fields: string, index: number = 0) {
    this.setGroupBy(fields, index);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC', index: number = 0) {
    this.setOrderBy(field, direction, index);
    return this;
  }

  orderByAsc(field: string, index: number = 0) {
    this.orderBy(field, 'ASC', index);
    return this;
  }

  orderByDesc(field: string, index: number = 0) {
    this.orderBy(field, 'DESC', index);
    return this;
  }

  limit(value: number) {
    this.setLimit(value);
    return this;
  }

  paginate(offset: number, limit: number) {
    this.setPage(offset, limit);
    return this;
  }

  build(): QueryResult {
    let builder = [this.clause];

    // map the fields by query table;
    let fields = [];
    for (const table of this.tables) {
      fields.push(table.fields);
    }
    if (fields.length === 1) {
      builder.push(fields.join(Conditions.CommaSeparator));
    }
    else {
      builder.push(fields.map(group => group.join(",")).join(","));
    }

    // map the tables;
    // let tables = [];
    // for (const table of this.tables) {
    //   tables.push(table.name);
    // }
    // builder.push(`FROM ${tables.join(Conditions.CommaSeparator)}`);
    builder.push(`FROM ${this.getMainTable().name}`);

    // map joins first
    let joins = [];
    for (const table of this.tables) {
      if (table.hasJoins()) {
        let { sql } = table.getJoins()
        joins.push(sql);
      }
    }
    if (joins.length) {
      builder.push(joins.join(Conditions.SpaceSeparator));
    }

    // map conditions;
    let conditions = [];
    let values = [];
    for (const table of this.tables) {
      if (table.hasConditions()) {
        let { sql, parameters } = table.getConditions();
        conditions.push(sql);

        if (parameters) {
          for (const value of parameters) {
            values.push(value);
          }
        }
      }
    }
    if (conditions.length) {
      builder.push(`WHERE ${conditions.join(Conditions.SpaceSeparator)}`);
    }

    // map group by
    let groupby = [];
    for (const table of this.tables) {
      if (table.hasGroupBy()) {
        groupby.push(table.getGroupBy());
      }
    }
    if (groupby.length) {
      builder.push(`GROUP BY ${groupby.join(Conditions.CommaSeparator)}`);
    }

    // map having
    /* ... */

    // map order by
    let orderby = [];
    for (const table of this.tables) {
      if (table.hasOderBy()) {
        orderby.push(table.getOrderBy());
      }
    }
    if (orderby.length) {
      builder.push(`ORDER BY ${orderby.join(Conditions.CommaSeparator)}`);
    }

    let limits = [];
    for (const table of this.tables) {
      if (table.hasLimit()) {
        limits.push(table.getLimit());
      }
    }
    if (limits.length) {
      builder.push(limits.join());
    }

    return new QueryResult(builder, values);
  }

}