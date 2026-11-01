import { spawnSync, SpawnSyncReturns } from 'child_process';
import { resolve } from 'path';
import { BootContext } from '../../../src/deepcore/boot/Context';
import { boot } from '../../../src/deepcore/boot/targets/Test';

jest.mock('child_process', () => ({ spawnSync: jest.fn() }));
const spawn = jest.mocked(spawnSync);
const context = (stage = 'development'): BootContext => {
  const value = new BootContext();
  value.set('env', { APP_STAGE: stage });
  return value;
};
const result = (changes: Partial<SpawnSyncReturns<Buffer>> = {}): SpawnSyncReturns<Buffer> => ({
  pid: 1, output: [], stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), status: 0, signal: null, ...changes,
});
const originalExecpath = process.env.npm_execpath;
beforeEach(() => {
  spawn.mockReset();
  spawn.mockReturnValue(result());
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  if (originalExecpath === undefined) delete process.env.npm_execpath;
  else process.env.npm_execpath = originalExecpath;
});

test.each([undefined, 'npm-cli.js', 'pnpm.cjs', 'pnpm.cmd'])('runs the local Jest directly regardless of npm_execpath=%s', async execpath => {
  if (execpath === undefined) delete process.env.npm_execpath;
  else process.env.npm_execpath = execpath;
  jest.spyOn(process, 'cwd').mockReturnValue(resolve(__dirname, 'unrelated-launch-directory'));
  await boot(context());
  const root = resolve(__dirname, '../../..');
  expect(spawn).toHaveBeenCalledWith(process.execPath,
    [require.resolve('jest/bin/jest'), '--config', resolve(root, 'jest.config.js'), '--runInBand', '--silent'],
    { cwd: root, stdio: 'inherit', shell: false });
});
test('skips Jest in production', async () => {
  await boot(context('production'));
  expect(spawn).not.toHaveBeenCalled();
});
test('aborts boot on a failing test suite', async () => {
  spawn.mockReturnValue(result({ status: 1 }));
  await expect(boot(context())).rejects.toThrow('código de salida: 1');
});
test('reports a process launch failure instead of treating it as a failed assertion', async () => {
  spawn.mockReturnValue(result({ status: null, error: new Error('ENOENT') }));
  await expect(boot(context())).rejects.toThrow('No se pudo iniciar Jest durante TEST.BOOT: ENOENT');
});
test('reports an interrupted test process', async () => {
  spawn.mockReturnValue(result({ status: null, signal: 'SIGTERM' }));
  await expect(boot(context())).rejects.toThrow('señal SIGTERM');
});
test('requires ROM to initialize the environment first', async () => {
  await expect(boot(new BootContext())).rejects.toThrow('ROM.BOOT');
  expect(spawn).not.toHaveBeenCalled();
});
