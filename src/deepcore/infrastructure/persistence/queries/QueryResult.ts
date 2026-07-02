

export class QueryResult {
  static readonly SpaceSeparator = ' ';

  query: string;
  parameters: string[];

  constructor(query: string | string[], parameters: string[]) {
    this.query = (Array.isArray(query)) ? query.join(QueryResult.SpaceSeparator) : query;
    this.parameters = parameters;
  }
}