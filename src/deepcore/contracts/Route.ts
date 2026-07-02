import { ApiProxyHandler } from '../application/http/HttpContracts';


export interface Route {

  path: string;
  method: string;
  handler: ApiProxyHandler;

};

