import * as http from 'http';
import { Router } from './Router';
import { Dispatcher } from './Dispatcher';
import { Security } from '../utils/Security';
import { Exception } from '../core/Exception';
import { HttpStatus } from './HttpContracts';


export interface EndpointSecurityList {
  [property: string]: string[];
}


export interface ServerOptions {
  port: number;
  apiKey: string;
  baseUrl: string;
  router: Router;
  apiSecurity: {
    whiteList: EndpointSecurityList;
    blackList: string[];
  }
}


export class Server {
  static instance: http.Server;

  private port: number;
  private apiKey: string;
  private baseUrl: string;

  private dispatcher: Dispatcher;

  // private whiteList: EndpointSecurityList = {};
  private blackList: string[] = new Array<string>();

  private get hasBlackList(): boolean {
    return (!!this.blackList.length);
  }

  constructor(options: ServerOptions) {
    this.port = options.port;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.dispatcher = new Dispatcher(options.router);

    // this.whiteList = {} as EndpointSecurityList;
    // if (options.apiSecurity?.whiteList?.length) {
    //   this.whiteList = options.apiSecurity.whiteList;
    // }

    this.blackList = new Array<string>();
    if (options.apiSecurity?.blackList?.length) {
      this.blackList = options.apiSecurity.blackList;
    }
  }

  start(): void {
    this.starterLog();
    const serverCallback = (request: any, response: any) => {

      const clientIp: string = ('x-forwarded-for' in request.headers)
        ? request.headers['x-forwarded-for'].split(', ')[0]
        : request.socket.remoteAddress;

      const requestId = Security.getRandomGUID(24);

      let timeLabel = `Server: Request ${requestId} -- duration`;

      (async () => {
        try {
          console.log('');
          console.log('');
          console.log(`Server: Request ${requestId} -- START`);
          console.log(`Server: ${request.method} ${request.url}`);
          console.time(timeLabel);

          if (this.hasBlackList && this.blackList.includes(clientIp)) {
            throw new Exception('403 Forbidden', HttpStatus.Forbidden);
          }

          if (request.method === 'OPTIONS') {
            this.preflightHandler(response);
            return;
          }

          if (!request.headers['x-api-key'] || request.headers['x-api-key'] !== this.apiKey) {
            throw new Exception('403 Forbidden', HttpStatus.Forbidden);
          }

          await this.dispatcher.doDispatch(request, response, { clientIp, requestId });
        }
        catch (error: any) {
          if (error instanceof Exception) {
            response.writeHead(error.code, error.message);
            response.write(error.message);
            response.end();
            return;
          }

          response.writeHead(HttpStatus.ServerError, 'Internal Server Error');
          response.write(error.message);
          response.end();
        }
        finally {
          console.timeEnd(timeLabel);
          console.log('');
          console.log('');
        }
      })();
    }

    Server.instance = http.createServer(serverCallback).listen(this.port);
  }

  private preflightHandler(response: any): void {
    response.writeHead(HttpStatus.NoContent, {
      'Access-Control-Allow-Origin': `${process.env.APP_HTTP_ORIGIN}`,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      "Access-Control-Allow-Headers": "Content-Type, X-Amz-Date, X-Amz-Security-Token, Authorization, X-Api-Key, X-Requested-With, Accept, Access-Control-Allow-Methods, Access-Control-Allow-Origin, Access-Control-Allow-Headers, X-Version",
      'Access-Control-Allow-Credentials': false,
      'Access-Control-Max-Age': 1728000,
      'Content-Length': 0,
      'Content-Type': 'application/json'
    });
    response.end();
    return;
  }

  private starterLog(): void {
    console.log('');
    console.log('Server: API - version 0.0.1');
    console.log('Server: ');
    console.log('Server: key with token: %s', this.apiKey);
    console.log('Server: Remember to use x-api-key on the request headers');
    console.log('Server: ');
    console.log('Server: [HTTP] server ready: %s:%d', this.baseUrl, this.port);
    console.log('');
  }

}