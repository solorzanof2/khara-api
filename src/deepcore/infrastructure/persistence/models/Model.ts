

export class Model {
  tablename: string;
  relations: string[];

  id!: number;
  get isPresent(): boolean {
    return (this.id !== undefined && this.id > 0);
  }

  constructor(tablename: string) {
    this.tablename = tablename;
    this.relations = new Array<string>();
    // this.isPresent = false;
  }

}