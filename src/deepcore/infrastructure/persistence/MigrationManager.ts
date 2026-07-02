import { MigrationKernel } from './core/MigrationKernel';


export class MigrationManager {

  private kernel: MigrationKernel;

  constructor(migrationRoute: string) {
    this.kernel = new MigrationKernel(migrationRoute);
  }

  static getInstance(route: string): MigrationManager {
    return new MigrationManager(route);
  }

  async initialize(): Promise<void> {
    try {
      await this.kernel.initialize();
      await this.kernel.start();
    }
    catch (error: any) {
      return Promise.reject(new Error(error.message));
    }
  }

}