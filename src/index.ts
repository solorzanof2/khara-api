import { BootManager } from './deepcore/boot/Manager';


(async () => {
  try {
    const bootManager = new BootManager();

    await bootManager.runAll();
  }
  catch (error) {
    console.error(`[FATAL-ERR0] INDEX > `, error);
    process.exit(1);
  }
})();

