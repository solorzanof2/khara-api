import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../http/HttpContracts';


export type APIMiddlify = (handler: ApiProxyHandler, middlewares: Middleware[]) => ApiProxyHandler;
export type MiddlewareChain = (middlewares: Middleware[]) => ApiProxyHandler;
export type Middleware = (event: ApiEvent, next: ApiProxyHandler) => Promise<ApiProxyResult>;


export const Middlify: APIMiddlify = (handler: ApiProxyHandler, middlewares: Middleware[]): ApiProxyHandler => {
  return (event: ApiEvent): Promise<ApiProxyResult> => {
    const middlewareChain: MiddlewareChain = ([initial, ...rest]): ApiProxyHandler => {
      if (!initial) {
        return handler;
      }

      return async (innerEvent: ApiEvent): Promise<ApiProxyResult> => {
        try {
          return initial(innerEvent, middlewareChain(rest));
        }
        catch (error) {
          return Promise.reject(error);
        }
      }
    }

    return (async (m: Middleware[], e: ApiEvent): Promise<ApiProxyResult> => {
      try {
        return middlewareChain(m)(e);
      }
      catch (error) {
        return Promise.reject(error);
      }
    })([...middlewares], event);
  }
};
