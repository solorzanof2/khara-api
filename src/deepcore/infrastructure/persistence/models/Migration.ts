

export class Migration {
  author: string;
  title: string;
  changeset: string;
  queriesCollection: string[];
  signature: string;
  rawContent: string;
  route: string;
  isProcedure: boolean;

  constructor() {
    this.author = '';
    this.title = '';
    this.changeset = '';
    this.queriesCollection = new Array<string>();
    this.signature = '';
    this.rawContent = '';
    this.route = '';
    this.isProcedure = false;
  }
}