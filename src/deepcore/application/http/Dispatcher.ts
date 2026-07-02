import { ApiCallbackProxyHandler, ApiEvent, ApiProxyHandler, ApiProxyResult, HttpStatus, ResponseHeader } from './HttpContracts';
import { ResponseEntity } from './ResponseEntity';
import { Router } from './Router';

const DefaultHeaders: ResponseHeader = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': `${process.env.HTTP_ORIGIN}`,
};

interface HttpRequest {
  url: string;
  method: string;
  headers: {
    [header: string]: string,
  },
  on(event: string, callback: Function): void;
}

interface ClientInfo {
  clientIp: string;
  requestId: string;
}

export class Dispatcher {

  private router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  async doDispatch(httpRequest: HttpRequest, httpResponse: any, clientInfo: ClientInfo): Promise<void> {
    const httpRequestMethod = httpRequest.method;

    const {
      pathParameters, queryStringParameters, handler, resourceName,
    } = this.router.getByMethod(httpRequestMethod, httpRequest.url);

    const requestEvent = {
      url: httpRequest.url,
      method: httpRequestMethod,
      headers: httpRequest.headers,
      pathParameters,
      queryStringParameters,
      clientIp: clientInfo.clientIp,
      requestId: clientInfo.requestId,
      resourceName,
      context: {},
    } as ApiEvent;

    if (httpRequestMethod === 'POST') {
      try {
        requestEvent.body = await this.parseBody(httpRequest);
      }
      catch (error) {
        console.log(error);
      }
    }

    try {
      if (handler.length === 1) {
        const handlerFunction = handler as ApiProxyHandler;
        this.send(httpResponse, await handlerFunction(requestEvent));
      }
      else {
        const handlerFunction = handler as ApiCallbackProxyHandler;
        handlerFunction(requestEvent, this.send.bind(this));
      }
    }
    catch (error: any) {
      this.send(httpResponse, await ResponseEntity.error(error).then((error: ApiProxyResult) => error));
    }
  }

  async parseBody(httpRequest: HttpRequest): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      // const headers = httpRequest.headers;

      httpRequest.on('data', (chunk: string) => {
        body += chunk;
      });

      httpRequest.on('end', async () => {
        if (body) {
          resolve(JSON.parse(body));
          return;
        }
      });
    });
  }

  private send(httpResponse: any, payload?: ApiProxyResult): void {
    try {
      if (!payload) {
        httpResponse.writeHead(HttpStatus.Ok, DefaultHeaders);
        return;
      }

      httpResponse.writeHead(HttpStatus.Ok, payload.headers);
      httpResponse.write(JSON.stringify(payload.body));
    }
    finally {
      httpResponse.end();
    }
  }

}