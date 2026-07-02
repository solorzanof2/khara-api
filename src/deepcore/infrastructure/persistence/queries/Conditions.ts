import { Query } from './Query';


export class Conditions extends Query {
  static readonly OpEquals = '=';
  static readonly OpNotEquals = '<>';
  static readonly OpGreaterThan = '>';
  static readonly OpGreaterEqualsThan = '>=';
  static readonly OpLessThan = '<';
  static readonly OpLessEqualsThan = '<=';
  static readonly OpAnd = 'AND';
  static readonly OpOr = 'OR';
  static readonly OpIn = 'IN';

  static readonly CommaSeparator = "', '";
  static readonly SpaceSeparator = ' ';

  constructor() {
    super();
  }

  where(field: string, operator: string, value: string, index: number = 0) {
    const alias = this.getAlias(index);
    const condition = `${alias}.${field} ${operator} ?`;
    this.setCondition(condition, value, index);
    return this;
  }

  equals(field: string, value: string, index: number = 0) {
    this.where(field, Conditions.OpEquals, value, index);
    return this;
  }

  notEquals(field: string, value: string, index: number = 0) {
    this.where(field, Conditions.OpNotEquals, value, index);
    return this;
  }

  greaterThan(field: string, value: string, index: number = 0) {
    this.where(field, Conditions.OpGreaterThan, value, index);
    return this;
  }

  greaterEqualsThan(field: string, value: string, index: number = 0) {
    this.where(field, Conditions.OpGreaterEqualsThan, value, index);
    return this;
  }

  lessThan(field: string, value: string, index: number = 0) {
    this.where(field, Conditions.OpLessThan, value, index);
    return this;
  }

  lessEqualsThan(field: string, value: string, index: number = 0) {
    this.where(field, Conditions.OpLessEqualsThan, value, index);
    return this;
  }

  whereJoin(tablename: string, fieldFK: string, foreignTablename: string, foreignFieldPK: string) {
    const leftAlias = this.getAliasByTableName(tablename);
    const leftPart = `${leftAlias}.${fieldFK}`;

    const rightAlias = this.getAliasByTableName(foreignTablename);
    const rightPart = `${rightAlias}.${foreignFieldPK}`;

    this.setJoinCondition(`${leftPart} = ${rightPart}`);
    return this;
  }

  innerJoin(foreignTablename: string, foreignFieldPK: string, tablename: string, fieldFK: string) {
    const foreignTable = this.getTableByName(foreignTablename);
    const leftPart = `${foreignTable.alias}.${foreignFieldPK}`;

    const rightAlias = this.getAliasByTableName(tablename);
    const rightPart = `${rightAlias}.${fieldFK}`;

    this.setInnerJoin(`INNER JOIN ${foreignTable.name} ON ${leftPart} = ${rightPart}`);
    return this;
  }

  leftJoin(foreignTablename: string, foreignFieldPK: string, tablename: string, fieldFK: string) {
    const foreignTable = this.getTableByName(foreignTablename);
    const leftPart = `${foreignTable.alias}.${foreignFieldPK}`;

    const rightAlias = this.getAliasByTableName(tablename);
    const rightPart = `${rightAlias}.${fieldFK}`;

    this.setLeftJoin(`LEFT JOIN ${foreignTable.name} ON ${leftPart} = ${rightPart}`);
    return this;
  }

  rightJoin(foreignTablename: string, foreignFieldPK: string, tablename: string, fieldFK: string) {
    const foreignTable = this.getTableByName(foreignTablename);
    const leftPart = `${foreignTable.alias}.${foreignFieldPK}`;

    const rightAlias = this.getAliasByTableName(tablename);
    const rightPart = `${rightAlias}.${fieldFK}`;

    this.setRightJoin(`RIGHT JOIN ${foreignTable.name} ON ${leftPart} = ${rightPart}`);
    return this;
  }

  and(index: number = 0) {
    this.setOperator(Conditions.OpAnd, index);
    return this;
  }

  safeAnd(index: number = 0) {
    if (this.hasConditions(index)) {
      this.and(index);
    }
    return this;
  }

  or(index: number = 0) {
    this.setOperator(Conditions.OpOr, index);
    return this;
  }

  in (field: string, values: string | string[], index = 0) {
    let inValues = (!Array.isArray(values)) ? [values] : values;
    const alias = this.getAlias(index);
    this.setOperator(`${alias}.${field} IN ('${inValues.join(Conditions.CommaSeparator)}')`);
    return this;
  }

  notIn(field: string, values: string | string[], index = 0) {
    let inValues = (!Array.isArray(values)) ? [values] : values;
    const alias = this.getAlias(index);
    this.setOperator(`${alias}.${field} NOT IN ('${inValues.join(Conditions.CommaSeparator)}')`);
    return this;
  }

}