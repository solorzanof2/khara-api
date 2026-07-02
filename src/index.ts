import { BootManager } from './deepcore/boot/Manager';


(async () => {
  try {
    const bootManager = new BootManager();

    await bootManager.runAll();
  }
  catch (error) {
    console.log(`[FATAL-ERR0] INDEX > ${error.message}`);
  }
})();

