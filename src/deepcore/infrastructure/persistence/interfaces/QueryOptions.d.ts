

export interface QueryOptions {
  replacements?: string[],
  raw: boolean;
  type?: string
}

export interface QueryArguments {
  sql: string;
  parameters?: string[];
  isSelect?: boolean;
}