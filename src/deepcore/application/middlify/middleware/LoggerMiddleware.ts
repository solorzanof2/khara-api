import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../http/HttpContracts';
import { Middleware } from '../Middlify';


const LoggerMiddleware: Middleware = async (event: ApiEvent, next: ApiProxyHandler): Promise<ApiProxyResult> => {
  try {
    console.log(`[INF0] ${event.requestId} | ${event.context['handlerCode']} invoked from ${event.clientIp.replace('::ffff:', '')}`);
  }
  catch (error) {
    console.error(`[ERR0] LoggerMiddleware - ${error.message}`);
  }

  return await next(event);
}


export const ProvideLoggerMiddleware = (handlerCode: string = ''): Middleware => {
  if (!handlerCode) {
    handlerCode = 'UNNAMED HANDLER';
  }

  return async (event: ApiEvent, next: ApiProxyHandler): Promise<ApiProxyResult> => {
    event.context['handlerCode'] = handlerCode;

    return LoggerMiddleware(event, next);
  }
}

