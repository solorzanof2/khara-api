

export class JoinQuery {

  type: string;
  sql: string;

  constructor(type: string = '', sql: string = '') {
    this.type = type;
    this.sql = sql;
  }
}