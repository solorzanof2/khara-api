import { Field } from '../interfaces/Field';
import { Table } from './Table';


export class Query {
  static readonly AllFields = '*';

  tables: Table[];
  fields: Field[];

  private get lastIndex(): number {
    return this.getLength() - 1;
  }

  constructor() {
    this.tables = new Array<Table>();
    this.fields = new Array<Field>();
  }

  addTable(fields?: string[]) {
    this.tables.push(new Table(fields || Query.AllFields));
  }

  getMainTable(): Table {
    return this.tables[0];
  }

  getLength(): number {
    return this.tables.length;
  }

  getAlias(index: number): string {
    return this.tables[index].getAlias();
  }

  disableAlias(): void {
    this.tables[this.lastIndex].avoidAlias();
  }

  getTableByName(value: string): Table {
    const table = this.tables.find(x => x.baseName === value);
    if (!table) {
      throw new Error(`Table with name ${value} could not found.`);
    }
    return table;
  }

  getAliasByTableName(value: string): string {
    return this.getTableByName(value).alias;
  }

  from(tablename: string) {
    const table = this.tables[this.lastIndex];
    table.setName(tablename, this.lastIndex);
    this.mapFields(table.fieldsMapping);
    return this;
  }

  mapFields(collection: Field[]): void {
    this.fields = [...this.fields, ...collection];
  }

  getFields(): Field[] {
    return this.fields;
  }

  getFieldByName(value: string, parent: string): Field {
    return this.fields.find(queryField => queryField.name === value && queryField.parent === parent) as Field;
  }

  setCondition(condition: string, value: string, index: number = 0): void {
    this.tables[index].setCondition(condition, value);
  }

  setJoinCondition(condition: string, index: number = 0): void {
    this.tables[index].setJoinCondition(condition);
  }

  setInnerJoin(value: string, index: number = 0): void {
    this.tables[index].setInnerJoin(value);
  }

  setLeftJoin(value: string, index: number = 0): void {
    this.tables[index].setLeftJoin(value);
  }

  setRightJoin(value: string, index: number = 0): void {
    this.tables[index].setRightJoin(value);
  }

  setOperator(value: string, index: number = 0): void {
    this.tables[index].setOperator(value);
  }

  setGroupBy(field: string, index: number = 0): void {
    this.tables[index].setGroupBy(field);
  }

  setOrderBy(field: string, direction: string, index: number = 0): void {
    this.tables[index].setOrderBy(field, direction);
  }

  setLimit(value: number, index: number = 0): void {
    this.tables[index].setLimit(value);
  }

  setPage(offset: number, limit: number, index: number = 0): void {
    this.tables[index].setPage(offset, limit);
  }

  hasConditions(index: number = 0): boolean {
    return this.tables[index].hasConditions();
  }

}