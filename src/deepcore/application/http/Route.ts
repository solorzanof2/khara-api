// import { Exception } from '../exceptions/Exception';
// import { ApiCallbackProxyHandler, ApiProxyHandler } from './ApiProxy';
// import { HttpStatus } from './HttpStatus';

import { ApiCallbackProxyHandler, ApiProxyHandler } from './HttpContracts';


export interface RouteOptions {
  route: string;
  methods?: string[] | string;
  handler: ApiProxyHandler | ApiCallbackProxyHandler;
}

export interface RouteComponent {
  handler: ApiProxyHandler | ApiCallbackProxyHandler;
  pathParameters: RouteParameters;
  queryStringParameters: RouteParameters;
  resourceName: string;
}

export interface RouteParameters {
  [key: string]: string;
}

export class Route {
  static readonly DefaultMethods: string[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  private route: string;

  private methods: string[] | string;

  private handler: ApiProxyHandler | ApiCallbackProxyHandler;

  constructor(params: RouteOptions) {
    this.route = params.route;
    this.methods = Route.DefaultMethods;

    if (params.methods) {
      this.methods = Array.isArray(params.methods) ? params.methods : [params.methods];
    }

    this.handler = params.handler;
  }

  /** @deprecated 18/03/2025 by Félix E. Solórzano C. */
  matches(path: string, method: string): boolean {
    if (!this.methods.includes(method)) {
      // throw new Exception('Method not allowed.', HttpStatus.MethodNotAllowed);
      console.log(`[ERR0] Route.Matches > El método ${method} no está permitido -- 405 Method Not Allowed`);
      return false;
    }

    const [basePath, queryStringSection] = path.split('?');
    const pathSections = basePath.split('/');
    const routeSections = this.route.split('/');

    if (pathSections.length !== routeSections.length) {
      return false;
    }

    this.parseQueryString(queryStringSection);

    const length = pathSections.length;

    let routeValue = '';
    let pathValue = '';
    for (let index = 0; index < length; index++) {
      routeValue = routeSections[index];
      pathValue = pathSections[index];

      if (routeValue === pathValue) {
        continue;
      }

      if (!routeValue.startsWith(':')) {
        return false;
      }

      // this.pathParameters[routeValue.replace(':', '')] = pathValue;
    }

    return true;
  }

  parseQueryString(value: string): RouteParameters {
    const queryString = {} as RouteParameters;

    if (!value) {
      return queryString;
    }

    const sections = value.split('&');

    let key = '';
    let keyValue = '';
    for (const section of sections) {
      [key, keyValue] = section.split('=');
      queryString[key] = keyValue;
    }

    return queryString;
  }

  execute(path: string, method: string): RouteComponent {
    if (!this.methods.includes(method)) {
      // throw new Exception('Method not allowed.', HttpStatus.MethodNotAllowed);
      return {} as RouteComponent;
    }

    const [basePath, queryStringSection] = path.split('?');
    const pathSections = basePath.split('/');
    const routeSections = this.route.split('/');

    if (pathSections.length !== routeSections.length) {
      return {} as RouteComponent;
    }

    const queryStringParameters = this.parseQueryString(queryStringSection);

    const length = pathSections.length;

    let routeValue = '';
    let pathValue = '';

    const pathParameters = {} as RouteParameters;

    for (let index = 0; index < length; index++) {
      routeValue = routeSections[index];
      pathValue = pathSections[index];

      if (routeValue === pathValue) {
        continue;
      }

      if (!routeValue.startsWith(':')) {
        return {} as RouteComponent;
      }

      pathParameters[routeValue.replace(':', '')] = pathValue;
    }

    return {
      handler: this.handler,
      pathParameters,
      queryStringParameters,
      resourceName: this.route,
    } as RouteComponent;
  }

}