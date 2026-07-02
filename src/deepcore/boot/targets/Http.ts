import { Routings } from '../../../Routing';
import { ApiProxyHandler } from '../../application/http/HttpContracts';
import { Router } from '../../application/http/Router';
import { BootContext } from '../Context';


type Route = {
  path: string;
  method: string;
  handler: ApiProxyHandler;
}

/** Endpoints, middlewares */
export async function boot(context: BootContext): Promise<void> {

  console.log(`[INF0] HTTP.BOOT > Inicializando Rutas, ${Routings.length} detectadas.`);

  const router = new Router();

  let route: Route;
  for (route of Routings) {
    router.add(route.path, route.handler, route.method);
  }

  context.set('router', router);

  return Promise.resolve();
}

