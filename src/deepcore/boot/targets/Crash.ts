import { BootContext } from "../Context";


export async function boot(_context: BootContext) {
  console.log("[INF0] BOOT.CRASH > Inicializando Manejador Global de Errores.");

  const gracefulExit = (code: number): void => {
    console.log("[ERR0] BOOT.CRASH > Stop crítico de la Aplicación.");
    process.exit(code);
  }

  process.on("uncaughtException", (error: any) => {
    console.error("[ERR0] BOOT.CRASH > Ocurrió un error no controlado.", error);
    gracefulExit(1);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[ERR0] BOOT.CRASH > Ocurrió un error asíncrono no controlado.", reason);
    gracefulExit(1);
  });

  process.on("SIGINT", () => {
    console.warn("[ERR0] BOOT.CRASH > Se recibió un SIGINT (Ctrl+C). Deteniendo la ejecución de la aplicación.");
    gracefulExit(0);
  });

  process.on("SIGTERM", () => {
    console.warn("[ERR0] BOOT.CRASH > Se recibió un SIGTERM. Deteniendo la ejecución de la aplicación.");
    gracefulExit(0);
  });

  console.log("[INF0] BOOT.CRASH > Se inicializó el Manejador Global de Errores.");

  return Promise.resolve();
}
