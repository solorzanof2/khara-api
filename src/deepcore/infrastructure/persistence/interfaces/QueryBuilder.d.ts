import { QueryResult } from '../queries/QueryResult';


export interface QueryBuilder {
  queryType: string;
  build(): QueryResult;
}