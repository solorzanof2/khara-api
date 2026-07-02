import { Model } from '../models/Model';


export class ChangelogModel extends Model {

  id: number;
  author: string;
  title: string;
  route: string;
  dateexecuted: string;
  signature: string;

  constructor() {
    super('databasechangelog');
    this.id = 0;
    this.author = '';
    this.title = '';
    this.route = '';
    this.dateexecuted = '';
    this.signature = '';
  }

}