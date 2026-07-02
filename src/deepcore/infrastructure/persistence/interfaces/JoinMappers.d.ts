

export type ColumnType = 'collection' | 'class';
export type FetchType = 'EAGER' | 'LAZY';
export type JoinType = 'LEFT'| 'INNER'

export interface Target {
  tablename: string;
  instance: any;
  fields: string[];
  targetClass: any;
}

export interface Column {
  target: Target;
  fetchType: FetchType;
  type: ColumnType;
  property: string;
}

export interface Join extends Column {
  fieldName: string;
}

export interface JoinColumn extends Join {
  updatable: boolean;
  joinType: JoinType;
}

export interface JoinTable extends Join {
  joinTablename: string;
  joinColumn: string;
  inverseJoin: string;
}

export interface JoinInverse extends Column {
  mappedBy: string;
  orphanRemoval: boolean;
}
