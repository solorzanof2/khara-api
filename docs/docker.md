# Imagen Docker de khara-api

La imagen usa Node.js 24.15.0 (Debian Bookworm slim) y pnpm 10.24.0.
La etapa de compilación instala también las devDependencies con
`pnpm install --frozen-lockfile --prod=false`, ejecuta `pnpm run build`
y elimina las dependencias de desarrollo con `pnpm prune --prod`.
La etapa final contiene únicamente las dependencias de producción, el JavaScript
compilado y las migraciones indicadas abajo. Ejecuta `node dist/index.js`
como el usuario sin privilegios `node`; no necesita pnpm ni herramientas de
compilación al arrancar.

## Construir fuera del servidor

Desde la raíz de este repositorio, con Docker y su motor Linux disponibles:

```sh
docker build --pull --tag khara-api:initial .
```

Si la máquina de construcción tiene una arquitectura distinta a la del servidor,
construir para la arquitectura del servidor. Por ejemplo, para un servidor x86_64:

```sh
docker buildx build --platform linux/amd64 --pull --load --tag khara-api:initial .
```

Ubuntu 24.04 es el sistema del host; no es necesario usar Ubuntu dentro de la
imagen. La compilación se realiza fuera del servidor de 2 vCPU y 2 GB de RAM.

## Ejecutar con variables externas

Crear y proteger fuera del repositorio un archivo como
`/etc/khara-api/api.env`. Usar el formato `NOMBRE=valor`, sin `export`,
y completar con los valores reales sin guardarlos en la imagen ni en Git.
El validador de entorno requiere estas variables:

- `APP_STAGE=production` y `APP_PORT=3000`.
- `APP_DEFAULT_URL`, `APP_DEFAULT_TIMEZONE`, `APP_DEFAULT_APIKEY`.
- `APP_ENABLE_AUDITORY`, `APP_DEBUG_MODE`, `APP_HTTP_ORIGIN`.
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`,
  `MYSQL_PASSWORD` (no vacía), `MYSQL_LOGGIN_SQL`.

`APP_STAGE=production` es necesario: otros modos intentan ejecutar Jest,
que se excluye de la imagen final. La imagen define por defecto
`NODE_ENV=production`, `APP_STAGE=production` y `APP_PORT=3000`.
El archivo externo puede sobrescribirlos; mantener el puerto interno en 3000
para el siguiente comando:

```sh
docker run --detach --name khara-api --env-file /etc/khara-api/api.env --publish 127.0.0.1:3000:3000 khara-api:initial
```

El puerto queda accesible desde el propio host. El servidor escucha sin host
explícito, por lo que no necesita modificar su código para recibir conexiones
dentro del contenedor. `APP_DEFAULT_URL` es informativa y no controla el bind.

Apuntar `MYSQL_HOST` al servidor MySQL 5.7.31 accesible desde el contenedor:
`localhost` identifica al propio contenedor, no al host ni a otra máquina.
Se conserva el driver `mysql` existente. No se agrega Redis, ni se necesitan
volúmenes para archivos subidos.

## Recursos de runtime y exclusiones

El arranque busca SQL en `/app/migrations` usando el directorio de trabajo.
TypeScript no los copia, por lo que el Dockerfile incorpora explícitamente:

- `01-initial-schema.sql`.
- `02-indexation.sql`.
- `03-add-roles.sql`.
- `06-create-invitations-table.sql`.

Se excluyen `04-add-superuser.sql` y `05-add-felixouser.sql` porque insertan
usuarios con credenciales precargadas y datos de ejemplo. Una base nueva no
recibirá esos usuarios ni sus datos asociados desde esta imagen. La base
existente conserva sus datos. No se editan los SQL ni el mecanismo de migración:
al arrancar, la aplicación mantiene su ejecución automática de las migraciones
incluidas. Validar el arranque únicamente contra una base autorizada para ello.

No se detectaron plantillas, certificados ni otros recursos locales necesarios
para producción. El contexto usa una lista de archivos permitidos y excluye
archivos de entorno, credenciales, certificados privados, dumps, backups,
`node_modules`, `.git`, logs y compilaciones locales. Las futuras migraciones
o recursos requieren revisión y alta explícita en Dockerfile y .dockerignore.

## Validación

`pnpm run build` valida la compilación sin iniciar el backend. Construir la
imagen también comprueba la instalación Linux con lockfile congelado y la poda
de devDependencies. Un build correcto no prueba el arranque ni la conexión a
MySQL: esa verificación requiere una base accesible y las variables externas.
No se incluye Compose ni configuración de Nginx en este paso.
