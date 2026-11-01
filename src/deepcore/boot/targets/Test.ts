import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { BootContext } from '../Context';

export async function boot(context: BootContext): Promise<void> {
  const environment = context.get<{ APP_STAGE: string }>('env');
  if (!environment) throw new Error('TEST.BOOT requiere el entorno inicializado por ROM.BOOT.');

  if (environment.APP_STAGE === 'production') {
    console.log('[INF0] TEST.BOOT > Omitiendo Tests en modo Producción.');
    return;
  }

  console.log('[INF0] TEST.BOOT > Inicializando Pruebas Unitarias.');
  console.log('[INF0] TEST.BOOT > Ejecutando Pruebas Unitarias en la ruta: tests/unit/**/*.test.ts');

  // Both src/ and dist/ keep the same depth. Do not depend on the launcher's working directory.
  const projectRoot = resolve(__dirname, '../../../..');
  // Run the installed Jest directly: npm_execpath can point to npm, pnpm or a Windows shim.
  const jestCli = require.resolve('jest/bin/jest');
  const result = spawnSync(process.execPath, [jestCli, '--config', resolve(projectRoot, 'jest.config.js'), '--runInBand', '--silent'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw new Error('No se pudo iniciar Jest durante TEST.BOOT: ' + result.error.message);
  }
  if (result.signal) {
    throw new Error('Las pruebas de TEST.BOOT fueron interrumpidas por la señal ' + result.signal + '.');
  }
  if (result.status !== 0) {
    console.log('[ERR0] TEST.BOOT > Fallaron las Pruebas Unitarias, abortando proceso de booteo.');
    throw new Error('Fallaron las Pruebas Unitarias (código de salida: ' + result.status + ').');
  }

  console.log('[INF0] TEST.BOOT > Todas las pruebas fueron aprobadas.');
}
