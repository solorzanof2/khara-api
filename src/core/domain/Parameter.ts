import { Model } from '../../deepcore/infrastructure/persistence/models/Model';
import { GlobalStatus } from '../commons/constants/GlobalConstants';
import { Partition } from '../commons/constants/Partitions';


export class Parameter extends Model {

  name: string = '';
  attributes: any = ''; // json [not null]
  createdAt: number = Date.now(); // bigint(20) [not null]
  updatedAt: number = Date.now(); // bigint(20) [not null]
  status: string = GlobalStatus.Active; // varchar(15) [not null, default: 'active']
  uid: string = ''; // varchar(127) [not null, unique]

  constructor() {
    super(Partition.Parameters);
    this.id = 0;
  }

}

