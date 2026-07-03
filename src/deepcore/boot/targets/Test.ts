import { spawnSync } from 'child_process';
import { BootContext } from '../Context';


export async function boot(context: BootContext): Promise<void> {
  const environment: any = context.get('env');

  if (environment.APP_STAGE === 'production') {
    console.log(`[INF0] TEST.BOOT > Omitiendo Tests en modo Producción.`);
    return Promise.resolve();
  }

  console.log(`[INF0] TEST.BOOT > Inicializando Pruebas Unitarias.`);
  console.log(`[INF0] TEST.BOOT > Ejecutando Pruebas Unitarias en la ruta: tests/unit/**/*.test.ts`);

  const pnpmCli = process.env.npm_execpath;
  const result = pnpmCli
    ? spawnSync(process.execPath, [pnpmCli, 'exec', 'jest', '--runInBand', '--silent'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    })
    : spawnSync('pnpm exec jest --runInBand --silent', {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });

  if (result.status !== 0) {
    console.log("[ERR0] TEST.BOOT > Fallaron las Pruebas Unitarias, abortando proceso de booteo.");
    return Promise.reject(new Error('Fallaron las Pruebas Unitarias.'));
  }

  console.log(`[INF0] TEST.BOOT > Todas las pruebas fueron aprobadas.`);

  return Promise.resolve();
}