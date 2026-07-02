import { runCLI } from "jest";
import { BootContext } from '../Context';
import * as fileSystem from 'fs';
import * as path from 'path';


export async function boot(context: BootContext): Promise<void> {
  const environment: any = context.get('env');

  if (environment.APP_STAGE === 'production') {
    console.log(`[INF0] TEST.BOOT > Omitiendo Tests en modo Producción.`);
    return Promise.resolve();
  }

  console.log(`[INF0] TEST.BOOT > Inicializando Pruebas Unitarias.`);

  const isCompiled = fileSystem.existsSync(path.resolve("dist"));
  const rootDir = isCompiled ? "dist" : "tests";
  const extension = isCompiled ? "js" : "ts";

  console.log(`[INF0] TEST.BOOT > Ejecutando Pruebas Unitarias en la ruta: ${rootDir}/unit/*.test.${extension}`);

  const { results } = await runCLI(
    {
      rootDir,
      testMatch: [`**/unit/**/*.test.${extension}`],
      testEnvironment: "node",
      // Opcional: para evitar que Jest salga del proceso (útil en booteo)
      passWithNoTests: false,
      silent: true,
      _: [''],
      $0: '',
    },
    ["."]
  );

  if (!results.success) {
    console.log("[ERR0] TEST.BOOT > Fallaron las Pruebas Unitarias, abortando proceso de booteo.");
    return Promise.reject(new Error('Fallaron las Pruebas Unitarias.'));
  }

  console.log(`[INF0] TEST.BOOT > Todas las pruebas fueron aprobadas.`);

  return Promise.resolve();
}
