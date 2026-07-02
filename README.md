# AUCTION PLATFORM - NODEJS

![](https://img.shields.io/badge/VERSION-0.0.1-green)
![](https://img.shields.io/badge/NodeJS-20.11.1-blue)
![](https://img.shields.io/badge/MySQL-8.x-blue)
![](https://img.shields.io/badge/DeepCORE-1.0.0-orange)

## Description


## Instalación
- Clonar Repositorio
- Activar base de motor `MySQL`, en su defecto instalar la versión `5.7.31`;
- Crear la base de datos con el nombre: `auction`
- Ejecutar el comando `npm i`;
- Configurar las variables de Entorno;
- Presionar `F5` para ejecutar **nodemon** en modo `DEBUG`;

### Consideraciones
- Las `Pruebas Unitarias` se ejecutarán de forma automática, siempre que la variable de entorno sea `APP_STAGE=development`, si está en modo producción las pruebas serán omitidas.
- La base de datos será generada por medio de la migración automática en el booteo del backend;
- La base de datos debe tener una contraseña, de otra forma el validador de variables de entorno, dará como fallida la verificación de las variables del archivo **.env** y el **BootManager** cancelará el arranque del proyecto;
- El SQL impreso en la terminal, se puede desactivar cambiando el valor de la variable `APP_DEBUG_MODE` a 'false';

## Archivo .ENV
```env
# APP_STAGE='production'
APP_STAGE='development'
APP_PORT='3000'
APP_DEFAULT_URL='http://localhost'
APP_DEFAULT_TIMEZONE='America/Argentina/Buenos_Aires'
APP_DEFAULT_APIKEY='f6090e871ec0720e225a130b23c03c66a28344c8e25dbd2f4f7787af4dc6b8ae7bcd7385a91ac5dc8759b598d55689c9ff46cd2ddace4dc88aa35593a3fbde18'
APP_ENABLE_AUDITORY='false'
APP_DEBUG_MODE='true'
APP_HTTP_ORIGIN='*'
APP_CHECK_WHITE_LIST='true'

MYSQL_HOST='localhost'
MYSQL_DATABASE='auction'
MYSQL_USER='sls' // modificar
MYSQL_PASSWORD='123456'
MYSQL_PORT='3306'
MYSQL_LOGGIN_SQL='false'
```

## DER de la base de datos


## Migraciones
- Se debe crear un archivo en la ruta `C:/.../nombre-proyecto/migrations/`
> De igual forma ya existe el primer archivo `01-initial_schema.sql`, en el cual se deberá agregar el SQL de la base de datos inicial;
- Se debe agregar una cabecera a cada migración que cumpla con la siguiente estructura `--changeset {nombre-usuario}:{numero | nombre-de-la-tarea}-{fecha YYYYMMDDhhss}`;
> e.g. **--changeset fsolorzano:IMP-202506201602**</br>

### La implementación completá deberá verse algo así:
```sql
--changeset fsolorzano:IMP-202506201602
CREATE TABLE `my_table` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  ...
);
```

## Anatomía del Backend

La Arquitectura se base en `Clean Architecture` adaptado a Handlers que emulan el funcionamiento de Lambdas de AWS;

```md
migrations/
|   contiene los archivos de base de datos para futuras mutaciones
src/
|-- adapters/
|     contiene los controllers y los archivos de persistencia explícitamente los repositories (ref. e.g. UserRepository);
|-- core/
|     contiene toda la estructura lógica de la aplicación (helpers, services, usecases, contracts, etc);
├── deepcore/
|     cotiene un clean architecture anidado orientado al CORE del proyecto;
|-- Routing.ts
|     contiene las rutas a API para los handlers;
tests/
|     contiene todas las pruebas unitarias;
```

![](docs/project-anatomy.png)

## API Reference

#### Base URL
```http
  http://localhost:3000
```

#### * API Key Requerida
```http
  HEADER x-api-key: 2c82e77c05b3204e3afb0c3cbcb330e3
```

## Authors

- Félix E. Solórzano [@solorzanof2](https://github.com/solorzanof2)


## License