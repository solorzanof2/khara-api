import { Field } from '../interfaces/Field';
import { ConditionQuery } from './ConditionQuery';
import { JoinQuery } from './JoinQuery';


export class Table {
  static readonly Condition = 'condition';
  static readonly Operator = 'operator';
  static readonly Join = 'join';
  static readonly InnerJoin = 'inner-join';
  static readonly LeftJoin = 'left-join';
  static readonly RightJoin = 'right-join';
  static readonly StringReplace = '%s';
  static readonly Field = '`%s`';
  static readonly CommaSeparator = ', ';

  index: number;
  baseName: string;
  name: string;
  baseAlias: string;
  alias: string;
  fields: string[];
  fieldsMapping: Field[];
  noAlias = false;

  private conditions: ConditionQuery[];
  private joins: JoinQuery[];
  private groupby: string[];
  private orderby: string[];
  private limit: string;

  constructor(fields: string[] | string) {
    this.index = 0;
    this.baseName = '';
    this.name = '';
    this.baseAlias = '';
    this.alias = Table.Field;
    this.fields = (Array.isArray(fields)) ? fields : [fields];
    this.fieldsMapping = new Array<Field>();
    this.conditions = new Array<ConditionQuery>();
    this.joins = new Array<JoinQuery>();
    this.groupby = new Array<string>();
    this.orderby = new Array<string>();
    this.limit = '';
  }

  setName(table: string, index: number = 0): void {
    this.name = Table.Field.replace(Table.StringReplace, `${table}`);
    this.baseName = table;
    this.setIndex(index);
  }

  setIndex(index: number): void {
    this.index = index;
    if (this.noAlias) {
      return;
    }
    this.baseAlias = `t${this.index}`;
    this.setAlias(Table.Field.replace(Table.StringReplace, this.baseAlias));
  }

  getAlias(): string {
    if (this.noAlias) {
      return this.name;
    }
    return this.alias;
  }

  setAlias(alias: string): void {
    this.alias = alias;
    this.name = `${this.name} AS ${this.alias}`;

    this.setFields();
  }

  setFields(): void {
    const fields = [];
    let alias = '';
    for (const field of this.fields) {
      if (field === '*') {
        fields.push(`${this.alias}.${field}`);
        continue;
      }
      alias = `${this.baseAlias}_${field}`;
      fields.push(`${this.alias}.${field} AS ${alias}`);
      this.fieldsMapping.push({
        name: field,
        alias,
        parent: this.baseName,
      } as Field);
    }
    this.fields = fields;
  }

  getConditions(): SqlAndParameters {
    const parts = [];
    const parameters = [];

    for (const condition of this.conditions) {
      const { type, sql, parameter } = condition;
      parts.push(sql);

      if (type === Table.Condition) {
        parameters.push(parameter);
      }
    }

    return {
      sql: parts.join(' '),
      parameters,
    } as SqlAndParameters;
  }

  setCondition(condition: string, value: string): void {
    this.conditions.push(new ConditionQuery(Table.Condition, condition, value));
  }

  setOperator(value: string): void {
    this.conditions.push(new ConditionQuery(Table.Operator, value));
  }

  setJoinCondition(value: string): void {
    this.conditions.push(new ConditionQuery(Table.Join, value));
  }

  getJoins(): SqlAndParameters {
    const parts = [];

    for (const join of this.joins) {
      const { sql } = join;
      parts.push(sql);
    }

    return {
      sql: parts.join(' '),
    } as SqlAndParameters;
  }

  setJoin(type: string, value: string): void {
    this.joins.push(new JoinQuery(type, value));
  }

  setInnerJoin(value: string): void {
    this.setJoin(Table.InnerJoin, value);
  }

  setLeftJoin(value: string): void {
    this.setJoin(Table.LeftJoin, value);
  }

  setRightJoin(value: string): void {
    this.setJoin(Table.RightJoin, value);
  }

  getGroupBy(): string {
    return this.groupby.join(Table.CommaSeparator);
  }

  setGroupBy(field: string): void {
    this.groupby.push(`${this.alias}.${field}`);
  }

  getOrderBy(): string {
    return this.orderby.join(Table.CommaSeparator);
  }

  setOrderBy(field: string, direction: string) {
    this.orderby.push(`${this.alias}.${field} ${direction}`);
  }

  getLimit(): string {
    return this.limit;
  }

  setLimit(value: number) {
    this.limit = `LIMIT ${value}`;
  }

  setPage(offset: number, limit: number) {
    this.limit = `LIMIT ${offset}, ${limit}`;
  }

  hasConditions(): boolean {
    return (this.conditions.length > 0);
  }

  hasJoins(): boolean {
    return (this.joins.length > 0);
  }

  hasGroupBy(): boolean {
    return (this.groupby.length > 0);
  }

  hasOderBy(): boolean {
    return (this.orderby.length > 0);
  }

  hasLimit(): boolean {
    return (this.limit?.length > 0);
  }

  avoidAlias(): void {
    this.noAlias = true;
  }

}

interface SqlAndParameters {
  sql: string;
  parameters: any[];
}