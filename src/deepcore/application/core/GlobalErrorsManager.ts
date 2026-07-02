

export class GlobalErrorsManager {

  constructor() { }

  async initialize(): Promise<void> {
    console.log(`[INF0] ErrorHandler.Initialize - Inicializando Manejador Global de Errores.`);

    process.on('uncaughtException', (error, origin) => {
      this.logAndDie(origin, error);
    });

    process.on('unhandledRejection', async (error, origin) => {
      this.logAndDie(`${(await origin)}`, error);
    });
  }

  private logAndDie(origin: string, error: any): void {
    console.log(`[FATAL-ERR0] ErrorHandler.LogAndDie > ${origin}, Error: ${error}`);
    process.exit(1);
  }

}

