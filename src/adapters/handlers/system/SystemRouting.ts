import { Route } from '../../../deepcore/contracts/Route';
import { SystemPingHandler } from './PingHandler';
import { TestingHandler } from './TestingHandler';


export const SystemRouting: Route[] = [
  {
    path: '/api/v1/system/ping',
    method: 'get',
    handler: SystemPingHandler,
  },
  {
    path: '/api/v1/system/testing',
    method: 'get',
    handler: TestingHandler,
  },
];

