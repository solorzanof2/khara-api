# Pruebas del backend con Posts unificados

El contrato vigente usa `Post` para publicaciones y respuestas. Los hijos se relacionan mediante `posts.parentId`; una raíz tiene `parentId = NULL`. Las lecturas devuelven `childs` y `totalChilds`, sin colecciones separadas de comentarios, insights o bricks. Los conteos de hijos consideran únicamente Posts activos. Las colecciones por usuario/proyecto conservan el filtro de Posts activos, incluyendo hijos.

Las 11 suites del dominio retirado se reemplazaron por cobertura de creación, edición y lectura de Posts hijos. Se conservan las pruebas de menciones, proyectos, renderizado, arranque y ping. Un `parentUid` en una edición valida la relación; la entidad modificada siempre es la indicada por `postUid`.

```powershell
pnpm test --runInBand
pnpm exec tsc -p tsconfig.build.json --noEmit
```

## Integración con MySQL aislado

`pnpm test:schema` requiere `KHARA_SCHEMA_TEST_PORT` y un servidor MySQL independiente, inicializado con `--no-defaults --initialize-insecure`, root local sin contraseña, bind `127.0.0.1` y datadir temporal terminado en `khara-schema-step2-<32 caracteres hexadecimales>/data/`. Ese nombre conserva la guardia de aislamiento de la prueba anterior. El script rechaza otros datadirs antes de crear su base de prueba; no carga `.env` ni inicia la API.

```powershell
$env:KHARA_SCHEMA_TEST_PORT = '<puerto del servidor temporal>'
pnpm test:schema
```

La prueba aplica las migraciones 01–06 usando el migrador real, las reaplica, verifica ausencia de tablas retiradas, prueba PostRepository con padres/hijos/nietos y comprueba paginación, conteos, guardado, NULL, FK y referencias mediante TaggableService y MentionService. Elimina únicamente su base aleatoria y cierra sus conexiones al terminar. Quien inicia el servidor temporal debe detenerlo después.

Verificación realizada con MySQL 5.7.31 independiente. Se corrigieron en el esquema inicial los tipos `biting(20)` y `tinyint()`, se agregó `posts.parentId` nullable con FK e índice y se retiraron índices sobre columnas que ya no existen. El ORM ahora conserva columnas cuyo valor inicial es NULL y actualiza NULL sin convertirlo en texto.

Estos cambios verifican instalaciones desde cero del esquema actual. No constituyen una migración de bases existentes ni un traslado de datos históricos. Los documentos `posts-unification-step-1.md` y `posts-unification-step-2.md` describen propuestas anteriores y no el contrato vigente.
