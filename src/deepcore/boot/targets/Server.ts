import { Server, ServerOptions } from '../../application/http/Server';
import { BootContext } from '../Context';


/** Arranque final del server */
export async function boot(context: BootContext): Promise<void> {

  console.log(`[INF0] SERVER.BOOT > Inicializando Server.`);

  const environment: any = context.get('env');
  const router = context.get('router');

  const options = {
    apiKey: environment.APP_DEFAULT_APIKEY,
    baseUrl: environment.APP_DEFAULT_URL,
    port: environment.APP_PORT,
    router
  } as ServerOptions;

  (new Server(options))
    .start();

  return Promise.resolve();
}

