import { QueryBuilder } from '../interfaces/QueryBuilder';
import { Conditions } from './Conditions';
import { QueryResult } from './QueryResult';



interface SetObject {
  [name: string]: any;
}


export class Update extends Conditions implements QueryBuilder {

  clause = 'UPDATE';
  fieldsCollection: string[];
  parameters: string[];

  get queryType(): string {
    return this.clause;
  }

  constructor(tablename: string) {
    super();
    this.fieldsCollection = new Array<string>();
    this.parameters = new Array<string>();

    this.addTable();
    this.from(tablename);
  }

  set(field: string, value: string) {
    const tableAlias = this.tables[0].alias;
    this.fieldsCollection.push(`${tableAlias}.${field} = ?`);
    this.parameters.push(value);
    return this;
  }

  setFromObject(data: SetObject) {
    let field = '';
    for (field in data) {
      this.set(field, data[field]);
    }
    return this;
  }

  build(): QueryResult {
    const builder = [this.clause];

    // map table;
    builder.push(this.tables[0].name);

    // map fields
    // builder.push(`SET ${this.fieldsCollection.join(Conditions.CommaSeparator)}`);
    builder.push(`SET ${this.fieldsCollection.join(', ')}`);

    let conditions = [];
    for (const table of this.tables) {
      if (table.hasConditions()) {
        let { sql, parameters } = table.getConditions();
        conditions.push(sql);

        if (parameters) {
          for (const value of parameters) {
            this.parameters.push(value);
          }
        }
      }
    }
    if (conditions.length) {
      builder.push(`WHERE ${conditions.join(Conditions.SpaceSeparator)}`);
    }

    return new QueryResult(builder, this.parameters);
  }

}