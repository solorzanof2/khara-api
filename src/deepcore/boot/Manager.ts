import { BootContext } from './Context';
import * as targets from "./targets";


type BootTarget = keyof typeof targets;


export class BootManager {
  private context: BootContext;

  constructor() {
    this.context = new BootContext();
  }

  public async runAll() {
    const sequence: BootTarget[] = [
      "rom",
      "crash",
      "test",
      "infra",
      "kernel",
      "services",
      "http",
      "server",
    ];

    for (const name of sequence) {
      await this.run(name);
    }
  }

  public async run(name: BootTarget): Promise<void> {
    const target = targets[name];
    if (!target) {
      throw new Error(`Boot target "${name}" not found`);
    }

    console.log(`[INF0] BootManager.Run > Ejecutando Boot: ${name}`);
    const start = Date.now();

    try {
      await target.boot(this.context);
      console.log(`[INF0] BootManager.Run > Finalizó la ejecución del Boot: ${name} in ${Date.now() - start}ms`);
    } catch (error) {
      console.error(`[INF0] BootManager.Run > Falló la ejecución del Boot: ${name}`, error);
      throw error;
    }
  }

  public getContext() {
    return this.context;
  }
}

