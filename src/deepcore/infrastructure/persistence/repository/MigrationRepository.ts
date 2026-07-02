import { ChangelogModel } from '../core/ChangelogModel';
import { Repository } from '../Repository';


export class MigrationRepository extends Repository<ChangelogModel> {

  constructor() {
    super(ChangelogModel);
  }

}