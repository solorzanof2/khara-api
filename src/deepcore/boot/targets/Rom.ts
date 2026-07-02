import { BootContext } from "../Context";
import { z } from "zod";
import dotenv from 'dotenv';
import * as path from 'path';


const envSchema = z.object({
  APP_STAGE: z.enum(["development", "production", "test"]),
  APP_PORT: z.string().regex(/^\d+$/).transform(Number),
  APP_DEFAULT_URL: z.string(),
  APP_DEFAULT_TIMEZONE: z.string(),
  APP_DEFAULT_APIKEY: z.string(),
  APP_ENABLE_AUDITORY: z.string().transform(Boolean),
  APP_DEBUG_MODE: z.string().transform(Boolean),
  APP_HTTP_ORIGIN: z.string(),
  MYSQL_HOST: z.string().min(1),
  MYSQL_PORT: z.string().regex(/^\d+$/).transform(Number),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().min(1),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_LOGGIN_SQL: z.string().transform(Boolean),
});


type EnvVars = z.infer<typeof envSchema>;

/** Carga variables/config */
export async function boot(context: BootContext): Promise<void> {
  console.log("[INF0] ROM.BOOT > Inicializando variables de entorno...");

  const environmentPath = path.join(path.resolve('.'), '.env');

  dotenv.config({
    path: environmentPath,
  });

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("[ERR0] ROM.BOOT > Las variables de entorno son inválidas.");
    console.error(result.error.format());
    throw new Error("Falló el ROM.BOOT, las variables de entorno son inválidas.");
  }

  const env: EnvVars = result.data;

  // Save the validated env in the context
  context.set("env", env);

  console.log("[INF0] ROM.BOOT > Las variables de entorno se validaron y se cargaron");

  return Promise.resolve();
}