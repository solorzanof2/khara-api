import { BootContext } from '../Context';


/** Websockets, APIs externas */
export async function boot(_context: BootContext): Promise<void> {

  console.log(`[INF0] KERNEL.BOOT > Inicializando Kernel.`);

  return Promise.resolve();
}

