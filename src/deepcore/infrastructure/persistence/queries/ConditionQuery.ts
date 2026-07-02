

export class ConditionQuery {

  type: string;
  sql: string;
  parameter: string;

  constructor(type: string = '', sql: string = '', parameter: string = '') {
    this.type = type;
    this.sql = sql;
    this.parameter = parameter;
  }

}