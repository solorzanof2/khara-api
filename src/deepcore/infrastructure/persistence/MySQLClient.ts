import * as mysql from 'mysql';
import { QueryBuilder } from './interfaces/QueryBuilder';


export interface MySQLConfiguration {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  logginSQL: boolean;
}


export class MySQLClient {
  static instance: MySQLClient;

  private connection;

  private loggingSQL = false;

  constructor(options: MySQLConfiguration) {
    this.connection = mysql.createConnection({
      host: options.host,
      user: options.user,
      password: options.password,
      database: options.name,
      port: options.port,
    });
    this.connection.connect();
    this.loggingSQL = options.logginSQL;
  }

  static getInstance(options?: MySQLConfiguration): MySQLClient {
    if (MySQLClient.instance) {
      return MySQLClient.instance;
    }

    MySQLClient.instance = new MySQLClient(options);

    return MySQLClient.instance;
  }

  async prepare(builder: QueryBuilder): Promise<any[] | any> {
    try {
      const sql = builder.build();

      if (this.loggingSQL) {
        console.log(sql.query);
      }

      if (sql.parameters.length) {
        return this.execute(sql.query, sql.parameters);
      }

      return this.plainExecute(sql.query);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  async plainExecute(query: string, isExternal: boolean = false): Promise<any[] | any> {
    return new Promise((resolve, reject) => {
      if (isExternal && this.loggingSQL) {
        console.log(query);
      }

      this.connection.query(query, (error: any, results: any, _fields: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(results);
      });
    });
  }

  async execute(query: string, values: any[], isExternal: boolean = false): Promise<any[] | any> {
    return new Promise((resolve, reject) => {
      if (isExternal && this.loggingSQL) {
        console.log(query);
      }

      this.connection.query(query, values, (error: any, results: any, _fields: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(results);
      });
    });
  }

}