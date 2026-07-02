// import { Exception } from '../exceptions/Exception';
// import { ApiCallbackProxyHandler, ApiProxyHandler } from './ApiProxy';
// import { HttpStatus } from './HttpStatus';
import { Exception } from '../core/Exception';
import { ApiCallbackProxyHandler, ApiProxyHandler, HttpStatus } from './HttpContracts';
import { Route, RouteComponent, RouteOptions } from './Route';



export class Router {
  static readonly Get = 'GET';
  static readonly Post = 'POST';
  static readonly Put = 'PUT';
  static readonly Patch = 'PATCH';
  static readonly Delete = 'DELETE';
  static readonly Head = 'HEAD';

  private routes: Route[];

  constructor() {
    this.routes = new Array<Route>();
  }

  private getMethodsCollection(): string[] {
    return [
      Router.Get, Router.Post, Router.Put, Router.Patch, Router.Delete, Router.Head,
    ];
  }

  all(route: string, handler: ApiProxyHandler | ApiCallbackProxyHandler): void {
    this.routes.push(new Route(<RouteOptions>{
      route, methods: this.getMethodsCollection(), handler,
    }));
  }

  add(route: string, handler: ApiProxyHandler | ApiCallbackProxyHandler, methods: string = Router.Get): void {
    methods = methods.toUpperCase();
    console.log(`[INF0] Router.Add > ${methods.padEnd(4, ' ')} - ${route}`);
    this.routes.push(new Route(<RouteOptions>{
      route, methods, handler,
    }));
  }

  get(route: string, handler: ApiProxyHandler | ApiCallbackProxyHandler): void {
    this.add(route, handler, Router.Get);
  }

  post(route: string, handler: ApiProxyHandler | ApiCallbackProxyHandler): void {
    this.add(route, handler, Router.Post);
  }

  head(route: string, handler: ApiProxyHandler | ApiCallbackProxyHandler): void {
    this.add(route, handler, Router.Head);
  }

  put(route: string, handler: ApiProxyHandler | ApiCallbackProxyHandler): void {
    this.add(route, handler, Router.Put);
  }

  delete(route: string, handler: ApiProxyHandler | ApiCallbackProxyHandler): void {
    this.add(route, handler, Router.Delete);
  }

  getByMethod(value: string, path: string): RouteComponent {
    let routeComponent = {} as RouteComponent;

    for (const route of this.routes) {
      routeComponent = route.execute(path, value);
      if (('handler' in routeComponent)) {
        return routeComponent;
      }
    }

    throw new Exception('Not Found.', HttpStatus.NotFound);
  }

}