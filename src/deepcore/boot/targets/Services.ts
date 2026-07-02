import { BootContext } from '../Context';


/** Dominio de negocio */
export async function boot(_context: BootContext): Promise<void> {

  console.log(`[INF0] SERVICES.BOOT > Inicializando Services.`);

  return Promise.resolve();
}

