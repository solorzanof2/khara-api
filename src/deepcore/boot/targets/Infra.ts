// import { DatabaseFactory, DatabaseOptions } from '../../infrastructure/persistence/DatabaseFactory';
import { MigrationManager } from '../../infrastructure/persistence/MigrationManager';
import { MySQLClient, MySQLConfiguration } from '../../infrastructure/persistence/MySQLClient';
import { BootContext } from '../Context';
import * as path from 'path';


/** Redis, DB, etc */
export async function boot(context: BootContext): Promise<void> {

  const environment: any = context.get('env');

  console.log(`[INF0] INFRA.BOOT > Inicializando Base de datos MySQL.`);

  const configuration = {
    host: environment.MYSQL_HOST,
    port: environment.MYSQL_PORT,
    user: environment.MYSQL_USER,
    password: environment.MYSQL_PASSWORD,
    name: environment.MYSQL_DATABASE,
    logginSQL: environment.MYSQL_LOGGIN_SQL,
  } as MySQLConfiguration;

  MySQLClient.getInstance(configuration);

  // ejecutar MIGRACIONES;
  const migrationsPath = path.join(path.resolve('.'), 'migrations');

  try {
    await MigrationManager
      .getInstance(migrationsPath)
      .initialize();
  }
  catch (error) {
    console.log(`[ERR0] INFRA.BOOT > Falló la ejecución de la Migración. ${error.message}`);
  }

  // inicializar REDIS;

  return Promise.resolve();
}

