

export type ApiEvent = {
  url: string;
  method: string;
  headers: {
    [property: string]: string;
  }
  pathParameters: {
    [property: string]: string;
  };
  queryStringParameters: {
    [property: string]: string;
  };
  body: any;
  [name: string]: any;
  clientIp: string;
  requestId: string;
  appVersion: string;
  platform: string;
  operatingSystem: string;
  webbrowser: string;
  principalUser: any;
  security: string;
  context: {
    [property: string]: string;
  }
  resourceName: string,
}


export type ResponseHeader = {
  [key: string]: string | boolean | number
};


export interface AppResponse {
  status: number | string;
  payload: any;
}


export type ApiProxyHandler = (event: ApiEvent) => Promise<ApiProxyResult>;

export type ApiCallbackProxyFunction = (response: ApiProxyResult) => void;
export type ApiCallbackProxyHandler = (event: ApiEvent, callback: ApiCallbackProxyFunction) => void;


export const HttpCodes = {
  200: 'Ok',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  500: 'Internal Server Error',
};

export enum HttpStatus {
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NoContent = 204,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  Conflict = 409,
  ServerError = 500,
};


export class ApiProxyResult {
  statusCode: number;
  headers: ResponseHeader;
  body: AppResponse;

  constructor(payload: any = {}, status: number = HttpStatus.Ok, headers?: ResponseHeader) {
    this.statusCode = HttpStatus.Ok;
    const responseHeader: ResponseHeader = {
      ...headers,
      'Access-Control-Allow-Origin': `${process.env.APP_HTTP_ORIGIN}`,
      // 'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    };
    this.headers = responseHeader;
    this.body = this.appResponse(payload, status);
  }

  private appResponse(payload: any, status: number): AppResponse {
    const appResponse = <AppResponse>{
      status,
      payload,
    };
    return appResponse;
  }
}


