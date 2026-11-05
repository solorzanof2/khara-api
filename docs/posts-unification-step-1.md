# Posts unificados — PASO 1: relevamiento y propuesta de correspondencia

Fecha: 2026-11-02. Base del backend: `43616f5384299ef0205fd3414ec772fad1ccad08`.

Actualización de seguimiento: el [PASO 2](posts-unification-step-2.md) documenta el esquema aditivo implementado y las decisiones finales. Las propuestas de este PASO 1 se conservan como relevamiento histórico; en particular, se eligió visibilityMode sin flexibilizar visibility, se agregó historial de capacidades y descripción por registro horario, y se reservó el tipo unified_post para referencias nuevas. No se trasladaron datos.

## Alcance y evidencia

Este documento es el entregable del PASO 1. No agrega esquema, migraciones, datos, lógica ni endpoints. «Confirmado» describe archivos del repositorio; «Propuesta» identifica decisiones pendientes de implementación. No se consultó una base de datos: el esquema descrito resulta de las migraciones versionadas, no certifica el estado desplegado ni la calidad de los datos existentes.

Se inspeccionaron ancestros del checkout y árbol del backend sin encontrar `AGENTS.md` aplicables. Se sigue la convención de Markdown en español dentro de `docs`, usada por [bricks.md](bricks.md). Se conserva el stack: TypeScript, Node.js, MySQL, DeepCORE propio, handlers, repositorios, servicios, JWT/policies y Jest. No se proponen dependencias nuevas.

Fuentes principales:

- [Esquema inicial](../migrations/01-initial-schema.sql), [índices](../migrations/02-indexation.sql) y migraciones [08](../migrations/08-insight-brick-content.sql), [09](../migrations/09-brick-categories.sql), [10](../migrations/10-simplify-brick-categories-and-time.sql), [11](../migrations/11-recreate-brick-categories.sql), [12](../migrations/12-expand-category-hashtags.sql).
- [Particiones](../src/core/commons/constants/Partitions.ts), [constantes](../src/core/commons/constants/GlobalConstants.ts), modelos en `src/core/domain` y repositorios en `src/adapters/persistence`.
- [Rutas activas](../src/adapters/handlers/posts/PostRouting.ts), [composición de rutas](../src/Routing.ts), handlers en `src/adapters/handlers/posts` y contratos en `src/core/contracts`.
- [PostReplyService](../src/core/services/PostReplyService.ts), [PostMapperService](../src/core/services/PostMapperService.ts), [BrickService](../src/core/services/BrickService.ts), [BrickTimeService](../src/core/services/BrickTimeService.ts) y [contratos de brick](../src/core/contracts/Brick.ts).

## 1. Estructura actual — confirmado

### 1.1 Identidades y jerarquía

Los nombres conceptuales `post_comments` y `post_insights` del pedido corresponden realmente a **`posts_comments` y `posts_insights`**. No usar los nombres conceptuales como nombres SQL.

| Unidad | Tabla real / Partition | Modelo / repositorio | Destino exacto de parentId |
| --- | --- | --- | --- |
| Publicación raíz | `posts` / `Posts` | `Post` / `PostRepository` | No tiene parentId |
| Comentario de publicación | `posts_comments` / `PostsComments` | `PostComment` / `PostCommentRepository` | FK nullable → `posts.id` |
| Insight de publicación | `posts_insights` / `PostInsight` | `PostInsight` / `PostInsightRepository` | FK nullable → `posts.id` |
| Comentario de insight | `insights_comments` / `InsightComments` | `InsightComment` / `PostInsightCommentRepository` | FK nullable → `posts_insights.id` |
| Brick de insight | `insights_bricks` / `InsightBricks` | `InsightBrick` / `InsightBrickRepository` | FK nullable → `posts_insights.id` |

Cada tabla tiene su propio autoincremento. `posts.id = 7` e `insights_bricks.id = 7` son identidades distintas. `uid` es único por tabla; no hay unicidad global entre las cinco. Los handlers generan GUID, pero eso no demuestra ausencia de duplicados históricos entre tablas. Los modelos usan `parentId = 0` como valor inicial; el SQL permite NULL y los handlers de alta exigen padre existente. No interpretar automáticamente 0 o un padre irresoluble como raíz válida.

### 1.2 Inventario completo de columnas

En las cinco tablas, salvo indicación contraria, las columnas son NOT NULL:

| Columnas comunes a las cinco | Tipo / semántica |
| --- | --- |
| `id` | BIGINT, PK, AUTO_INCREMENT |
| `uid` | VARCHAR(50), UNIQUE; identificador público |
| `status` | VARCHAR(20); valores/defaults distintos, ver 1.4 |
| `createdAt`, `updatedAt` | BIGINT(20); código usa milisegundos Unix de Date.now() |
| `attributes` | JSON; servicios/repositorios admiten string u objeto |
| `userId` | BIGINT(20); cuenta de usuario |
| `authorId` | BIGINT(20); identidad de presentación en global_mentions |
| `workspaceId`, `projectId` | BIGINT(20); contexto persistido en cada entidad |
| `markdownSource`, `htmlSource` | LONGTEXT; en bricks agregadas por migración 08 |

| Tabla | Columnas adicionales y restricciones |
| --- | --- |
| `posts` | `visibility VARCHAR(12) NOT NULL DEFAULT 'internal'`; sin parentId |
| `posts_comments` | `parentId BIGINT(20) NULL`, `hashtags VARCHAR(512) NULL`, `mentions VARCHAR(512) NULL` |
| `posts_insights` | `parentId BIGINT(20) NULL`, `votes BIGINT(20) NOT NULL DEFAULT 0` |
| `insights_comments` | `parentId BIGINT(20) NULL` |
| `insights_bricks` | `parentId BIGINT(20) NULL`, `category VARCHAR(128) NOT NULL DEFAULT 'General'` tras 11 (inicialmente VARCHAR(63), ampliada a 80 en 10) |

`hashtags` y `mentions` de `posts_comments` existen en SQL pero no en el modelo actual `PostComment`; no deben perderse por extraer solo propiedades TypeScript. `votes` existe históricamente: se conserva en origen, sin diseñar ni implementar votaciones.

Relaciones de modelos que no son columnas: `Post.comments`, `Post.insights`, `Post.author` y `PostInsight.comments`. PostRepository configura inverse join con comentarios y join INNER con GlobalMention; su inverse join de insights está comentado. PostInsightRepository configura inverse join con InsightComment.

### 1.3 Claves e índices

Todas tienen PK(id), UNIQUE(uid) y estos índices secundarios de 02. Los nombres son literales y cada índice listado cubre una columna:

| Tabla | Índices secundarios (nombre → columna) |
| --- | --- |
| `posts` | idx_posts_uid → uid; idx_posts_status → status; idx_posts_created → createdAt; idx_posts_user → userId; idx_posts_author → authorId; idx_posts_workspace → workspaceId; idx_posts_project → projectId |
| `posts_comments` | idx_posts_comments_uid → uid; idx_posts_comments_status → status; idx_posts_comments_created → createdAt; idx_posts_comments_parent → parentId; idx_posts_comments_user → userId; idx_posts_comments_author → authorId; idx_posts_comments_workspace → workspaceId; idx_posts_comments_project → projectId |
| `posts_insights` | idx_insights_uid → uid; idx_insights_status → status; idx_insights_created → createdAt; idx_insights_parent → parentId; idx_insights_user → userId; idx_insights_votes → votes; idx_insights_author → authorId; idx_insights_workspace → workspaceId; idx_insights_project → projectId |
| `insights_comments` | idx_insights_comments_uid → uid; idx_insights_comments_status → status; idx_insights_comments_created → createdAt; idx_insights_comments_parent → parentId; idx_insights_comments_user → userId; idx_insights_comments_author → authorId; idx_insights_comments_workspace → workspaceId; idx_insights_comments_project → projectId |
| `insights_bricks` | idx_insights_bricks_uid → uid; idx_insights_bricks_status → status; idx_insights_bricks_created → createdAt; idx_insights_bricks_parent → parentId; idx_insights_bricks_user → userId; idx_insights_bricks_comments_author → authorId; idx_insights_bricks_comments_workspace → workspaceId; idx_insights_bricks_comments_project → projectId |

FK comunes en 01: authorId → global_mentions.id, workspaceId → workspaces.id, projectId → projects.id. Las cuatro tablas de respuestas también tienen userId → users.id; **posts.userId no tiene FK declarada**, aunque sí índice. Las FK de parentId son las de 1.1. No se declaran ON DELETE CASCADE ni ON UPDATE CASCADE. MySQL puede crear índices adicionales de soporte de FK; sus nombres efectivos y motor/collation desplegados requieren SHOW CREATE TABLE en entorno autorizado, no consultado aquí.

### 1.4 Autor, fechas, estados, borrado y contexto

| Tabla | Default SQL / modelo / alta por handler | Lectura y edición observadas |
| --- | --- | --- |
| `posts` | active / Active / Active | Detalle y listas autenticadas requieren active; edición raíz no filtra estado explícitamente |
| `posts_comments` | active / Pending / Active | Inverse join del post sin filtro propio de estado; edición exige active |
| `posts_insights` | pending / Pending / Active | findByParentId y detalle insight excluyen deleted; edición exige active |
| `insights_comments` | active / Active / Active | findByParentId exige active; inverse join desde insight sin ese filtro; edición exige active |
| `insights_bricks` | pending / Pending / Pending | Lectura y edición excluyen deleted; admiten pending |

Comentarios SQL: posts: active/archived/deleted; posts_comments: active/inactive/deleted; posts_insights e insights_bricks: pending/done/reported/none; insights_comments: active/deleted. Son comentarios en VARCHAR, no ENUM ni CHECK. El código también usa deleted en insights/bricks. `status = reported` no equivale al booleano reported de un tramo horario.

No hay deletedAt ni endpoint DELETE para estas unidades en PostRouting. Se observa exclusión lógica por estado, no un flujo publicado de borrado de publicaciones. Repository genérico tiene deleteById, lo que no demuestra su exposición. Al editar respuestas, PostReplyService elimina físicamente y recrea taggables y mentions; ese borrado de referencias no borra la unidad.

userId identifica la cuenta autenticada y autoriza ediciones de respuestas; authorId resuelve displayName/mention en global_mentions. No son intercambiables. Altas requieren GlobalMention activo del principal. Las fechas se establecen en servidor; editar conserva createdAt y cambia updatedAt. En bricks updatedAt avanza como máximo entre Date.now() y el anterior + 1 para concurrencia.

Todas guardan proyecto y workspace. Solo posts tiene visibilidad propia: al crear se copia del proyecto. Los hijos guardan proyecto del padre, sin columna visibility. Los detalles devuelven además la visibilidad actual del proyecto; no es necesariamente igual a la copia en posts. Los handlers validan contexto, lo que no demuestra comprobación completa de membresía por registro (ver 6).

### 1.5 Endpoints y dependencias

Prefijo de todas las rutas: `/api/v1/posts`. Están registradas en PostRouting y usan policy/logger.

| Entidad/contexto | Método y sufijo | Handler / dependencia principal |
| --- | --- | --- |
| Raíz | POST (sin sufijo) | CreatePostHandler → PostRepository, PostMapperService, TaggableService, MentionService, ProjectService y repositorios de contexto/autor |
| Raíz | POST `/update` | UpdatePostHandler → PostRepository, PostMapperService, TaggableService, repositorios de contexto |
| Raíz y respuestas | GET `/single?ref=<postUid>` | ReadPostHandler → PostRepository, PostInsightRepository, ProjectRepository, GlobalMentionRepository |
| Raíces del proyecto | GET `/collection?ref=<projectUid>&page=0&perPage=10` | ReadPostsCollectionHandler → PostRepository, PostInsightRepository para conteos, ProjectRepository |
| Raíces del principal | GET `/collection/owner?page=0&perPage=10` | ReadPostCollectionByUserHandler → los anteriores, filtro principalUser.id |
| Comentario de post | POST `/comments` | CreatePostCommentHandler → PostCommentRepository, PostReplyService, repositorios padre/contexto/autor |
| Comentario de post | POST `/comments/update` | UpdatePostCommentHandler → factory createUpdatePostReplyHandler, PostCommentRepository |
| Insight | POST `/insights` | CreatePostInsightHandler → PostInsightRepository, PostReplyService, repositorios padre/contexto/autor |
| Insight | POST `/insights/update` | UpdatePostInsightHandler → misma factory, PostInsightRepository |
| Insight y sus hijos | GET `/insights/single?ref=<insightUid>` | ReadInsightHandler → PostInsightRepository, PostRepository, ProjectRepository, PostInsightCommentRepository, InsightBrickRepository, GlobalMentionRepository y mapInsightResponse |
| Comentario de insight | POST `/insights/comment` | CreateInsightCommentHandler → createInsightReplyHandler, PostInsightCommentRepository, PostReplyService |
| Comentario de insight | POST `/insights/comment/update` | UpdateInsightCommentHandler → createUpdatePostReplyHandler, PostInsightCommentRepository |
| Brick | POST `/insights/bricks` | CreateInsightBrickHandler → createInsightReplyHandler, InsightBrickRepository, BrickService, PostReplyService |
| Brick | POST `/insights/bricks/update` | UpdateInsightBrickHandler → updateBrick, BrickService, InsightBrickRepository.saveChanges |
| Brick/tiempo | POST `/insights/bricks/time` | UpdateInsightBrickTimeHandler → updateBrick, BrickTimeService, BrickService, saveChanges, PostReplyService |
| Bricks del insight | GET `/insights/bricks/collection?ref=<insightUid>` | ReadInsightBricksCollectionHandler → repositorios insight/padre/proyecto/bricks/autores y mapInsightResponse |
| Categorías de brick | GET `/insights/bricks/categories?ref=<insightUid>&workspaceUid=...` | ReadBrickCategoriesHandler → BrickCategoryContextService, BrickCategoryService |

Las factories de actualización resuelven padres en PostRepository para comment/insight y PostInsightRepository para insight-comment/insight-brick. BrickService prepara contenido/categoría/atributos; BrickTimeService calcula tiempo. PostReplyService centraliza metadatos y reemplazo de referencias; PostMapperService indexa hashtags/menciones y TaggableService persiste asociaciones. MentionService persiste referencias globales y resuelve proyectos/usuarios en altas raíz. ProjectService puede crear proyecto por mención o proyecto predeterminado cuando no se envía projectUid.

Existen ReadInsightsCollectionHandler y publics/PaginatedPostsHandler, pero **no están registrados** en PostRouting ni Routings. El primero depende de post.insights cuyo join está comentado. No son endpoints activos que deban inventarse al migrar. Las lecturas raíz/insight dependen también de comentarios mediante inverse joins. Dates y LABEL generan etiquetas de presentación. No se identificó otro servicio de negocio específico de comentarios.

## 2. Hashtags

### Confirmado

`tags`: id BIGINT PK autoincremental; name VARCHAR(128) UNIQUE tras 12; category VARCHAR(20) default mention (mention/hashtag); link VARCHAR(512); usageCount BIGINT default 1; userId BIGINT FK users. Todas NOT NULL. Índices secundarios idx_tags_name(name), idx_tags_usage(usageCount), idx_tags_user(userId).

`taggables`: id BIGINT PK autoincremental, uid VARCHAR(50) UNIQUE NOT NULL, createdAt/updatedAt BIGINT NOT NULL, tagId BIGINT nullable FK tags, parentType VARCHAR(127) NOT NULL default post, parentId BIGINT NOT NULL, userId BIGINT nullable FK users, attributes JSON NOT NULL. Índices de 02: idx_taggables_uid(uid), idx_taggables_created(createdAt), **idx_taggables_type_id(parentType,parentId)**, idx_taggables_tag(tagId), idx_taggables_user(userId). No hay FK polimórfica de parentId ni UNIQUE(parentType,parentId,tagId).

| parentType literal | parentId apunta a |
| --- | --- |
| post | posts.id |
| post_comment | posts_comments.id |
| insight | posts_insights.id |
| insight_comment | insights_comments.id |
| insight_brick | insights_bricks.id |

TaggableService.create guarda hashtags y menciones en la misma tabla; para separar hashtags se consulta tags.category = hashtag. `mentions` es además otra tabla de relaciones con global_mentions: no sustituirla por taggables.

PostMapperService procesa HTML generado con MarkdownIt, reconoce `/(?<![\w@])[@#][\w_-]+/g`, evita texto dentro de a/code/pre/script/style y deduplica token exacto por renderizado. No normaliza globalmente a minúsculas los hashtags del usuario. TagService busca por nombre, categoría y usuario, pero SQL declara name único globalmente: hay una discrepancia de alcance que auditar antes de deduplicar. usageCount aumenta al procesar etiquetas; no es conteo fiable de asociaciones actuales (editar también lo incrementa).

Los enlaces son `webapp/explore/hashtags/<name>` o `webapp/explore/mentions/<name>` dentro del HTML. PostReplyService añade `#comment`, `#insight` o `#brick` y `@<mención del proyecto>` como metadatos; son etiquetas de contenido, no clasificaciones del dominio. En bricks, BrickService agrega hashtag de categoría, sin acentos/signos/espacios y en minúsculas, más Tiempo si existe. Análisis → #analisis. Categoría admite texto libre normalizado NFKC, espacios compactados y longitud 1–128; guardar no crea automáticamente una fila de brick_categories.

Al editar respuestas, replaceReferences borra por tipo/ID y recrea asociaciones. UpdatePostHandler añade taggables sin borrar anteriores y no reemplaza mentions. Pueden existir duplicados/referencias antiguas: no borrarlos silenciosamente al migrar.

### Propuesta: reutilizar taggables

No hace falta otra tabla de hashtags. Conservar tags y taggables con sus identidades/metadatos. Agregar a taggables **postId nullable FK posts.id** e índice (postId,tagId). Para cada fila histórica, resolver postId con 5 usando parentType y parentId, sin alterar esos campos ni recrear asociaciones. post_comment:7 e insight_brick:7 apuntan a posts diferentes aunque compartan tagId. Las referencias inválidas quedan intactas y se reportan; nunca se asignan al post con el mismo número por aproximación.

Durante coexistencia, lectores nuevos usan postId y antiguos siguen usando parentType/parentId. Las raíces también reciben resolución explícita. No convertir inmediatamente todos los parentType a post: borraría procedencia y mezclaría namespaces mientras hay escrituras antiguas. Una conversión futura requeriría retirar el contrato antiguo y conservar mapping.

Nuevas unidades se asocian por postId a cualquier profundidad. Campos polimórficos se completan solo con una proyección antigua definida. No agregar aún UNIQUE(postId,tagId): primero identificar duplicados y acordar conservación de procedencia; los lectores pueden proyectar conjuntos sin destruir filas. Conservar tagId, name, link, category, usageCount, uid, fechas, userId y attributes. No reparsear HTML para reconstruir etiquetas persistidas.

`mentions` necesita tratamiento paralelo (postId nullable y mapping) para referencias a personas/proyectos, aunque no sea hashtag. No confundir mentions.parentId (contenido origen) con global_mentions.parentId (usuario/proyecto/equipo/cliente); no remapear este último indiscriminadamente a posts.

## 3. Registro horario

### 3.1 Estructura real — confirmado

[Brick.ts](../src/core/contracts/Brick.ts) define attributes.time opcional:

- measurements: array ordenado; cada elemento contiene startedAt (number), finishedAt (number o null), label (string de duración), millis (number), createdAt (number) y reported (boolean).
- totals: millis y label del total finalizado, createdAt, updatedAt y reported (string de duración reportada, **no booleano**).

Hay intervalos, duraciones agregadas y temporizadores: abierto significa finishedAt = null y millis = 0. No hay timer separado. No hay descripción por intervalo, reportedAt, autor propio del tramo ni identificador estable del tramo. label expresa duración, no una tarea. Descripción del brick es markdownSource (o attributes.description en compatibilidad antigua); category es columna. attributes permite otras claves/unidades, que los servicios conservan.

Ejemplo sintético/anónimo conforme al contrato actual, sin datos de usuarios ni extracción de producción. Dos tramos cerrados (2 h reportadas y 30 min sin reportar) y un temporizador abierto; fechas solo ilustrativas:

```json
{
  "time": {
    "measurements": [
      { "startedAt": 1700000000000, "finishedAt": 1700007200000, "millis": 7200000, "label": "2h", "createdAt": 1700000000000, "reported": true },
      { "startedAt": 1700008000000, "finishedAt": 1700009800000, "millis": 1800000, "label": "30min", "createdAt": 1700010000000, "reported": false },
      { "startedAt": 1700010100000, "finishedAt": null, "millis": 0, "label": "0s", "createdAt": 1700010100000, "reported": false }
    ],
    "totals": { "millis": 9000000, "label": "2h 30min", "createdAt": 1700000000000, "updatedAt": 1700010100000, "reported": "2h" }
  }
}
```

Un brick sin tiempo puede tener attributes vacío. No equivale a registrar cero tiempo: no fabricar tramo ni time al migrar.

Forma antigua reconocida por BrickService y migración 10, también sintética:

```json
{
  "description": "Trabajo de ejemplo",
  "category": { "name": "General" },
  "measurements": { "time": { "millis": 5400000, "label": "1h 30min" } }
}
```

Esta forma solo acredita duración agregada, no inicio/fin reales. Migración 10 y BrickService.attributes pueden convertirla a un tramo derivado de createdAt. La migración crea copia completa `insights_bricks_before_time_model`, mueve descripción/categoría y retira copias antiguas en attributes. SQL usa GREATEST(0, createdAt - millis); initial() rechaza millis > now: diferencias relevantes para valores extremos. El archivo no prueba que esa migración ni su respaldo existan en una base concreta.

### 3.2 Validaciones, cálculos y concurrencia — confirmado

| Operación | Comportamiento real |
| --- | --- |
| start | Date.now() del servidor; rechaza otro abierto (409); agrega tramo abierto con reported false |
| finish | Requiere abierto (409); ahora >= startedAt (409 si no); fija fin y millis = fin - inicio; admite cero si reloj coincide |
| add | Fechas number y enteros seguros; inicio >= 0, fin <= 8640000000000000 y fin > inicio (400); crea cerrado, calcula label/millis, createdAt = ahora y reported false |
| report con measurementIndex | Índice entero existente, no string (400 si inválido); exige cerrado (409); reported = true |
| report sin índice | Requiere algún cerrado; marca todos los cerrados, deja abierto sin reportar; repetible sin inflar total |
| Otra acción | 400 |
| totals | Suma millis guardados de cerrados; suma reportados cerrados para el texto reported; rechaza total no entero seguro o negativo; preserva totals.createdAt, actualiza totals.updatedAt |

label descompone ms en h/min/s/ms con espacios, omite ceros; 0 → 0s. No descuenta solapamientos, no redondea a horas facturables, no incluye tiempo que transcurre en abierto ni impide intervalos futuros. El cliente convierte fechas manuales a ms Unix; el contador visual no persiste ticks. add ignora millis/label/reported enviados: el handler solo entrega el par de fechas.

Compatibilidad: crear brick (o editar uno sin time) admite duration.amount positivo, número o string decimal con punto/coma, unit minutes/hours. Convierte con Math.round, exige ms entero seguro > 0 y duración <= ahora. Ese tramo inicial usa fin = ahora e inicio = ahora - duración: representación manual derivada, no evidencia de cronometraje. reported inicial booleano opcional, false por defecto. Con time existente, editar con nueva duration falla; editar categoría/descripción conserva historial.

El servicio no valida completamente cualquier JSON histórico: totals usa millis guardados sin recalcular cada intervalo. No presumir que datos antiguos pasaron validaciones actuales.

Endpoint: exige replyUid, parentUid, workspaceUid, principal autenticado, autor global activo, brick e insight no deleted, proyecto/workspace consistentes; solo entity.userId puede editar. saveChanges compara updatedAt y attributes previos (comparación binaria de su representación), además de excluir deleted; affectedRows distinto de 1 devuelve 409. Luego regenera HTML/referencias. No se observa transacción que cubra guardado y reemplazo de referencias. Conservar protección contra pérdida de actualizaciones sin presentar atomicidad total como garantía actual.

### 3.3 Correspondencia propuesta sin fechas inventadas

Asociar registros directamente a postId, independiente de brick. Preservar JSON original y orden antes de normalizar. Por cada measurements[i] actual, crear registro con ordinal i, campos originales y provenance imported_interval; conservar abierto con finishedAt NULL. No finalizarlo al migrar ni sumar tiempo hasta la migración. No afirmar si un intervalo actual fue timer, manual o derivado: el JSON no distingue esos orígenes.

Para duración agregada antigua sin intervalos fiables: registro legacy_aggregate, millis original, startedAt/finishedAt NULL y reported NULL sin dato explícito. No usar fecha del brick como fecha de trabajo; conservar labels/fechas de contenedor por separado. Si 10 ya produjo intervalos derivados, conservarlos tal cual; marcar procedencia solo si un respaldo lo demuestra. Si no, unknown. No duplicar sumando duración del respaldo más intervalo convertido: respaldo es evidencia, no otra carga de trabajo.

Conservar totals como snapshot completo. Comparar sumas derivadas con él; reportar discrepancias y conservar ambos sin sobrescribir en copia. No eliminar attributes.time en la transición. Preservar claves desconocidas de attributes/time. Un total sin measurements no permite reconstruir intervalos: tratarlo como agregado con procedencia explícita, sujeto a revisión y sin inventar fechas/reported.

## 4. Modelo destino — propuesta

### 4.1 Posts y relaciones

Se propone **ampliar posts existente**, conservar IDs de raíces y asignar nuevos IDs a las otras cuatro fuentes. No crear otra tabla general de contenido. Los nombres siguientes son de diseño, no SQL implementado.

| Campo destino | Definición propuesta |
| --- | --- |
| id | BIGINT PK autoincremental; conservar id de raíces |
| uid | VARCHAR(50) UNIQUE canónico global; conservar origen sin colisión, ver 5 |
| parentId | BIGINT nullable FK posts.id; raíz NULL; sin tipo de padre separado |
| markdownSource, htmlSource | LONGTEXT; copia exacta inicial, sin regenerar |
| userId, authorId | BIGINT; conservar cuenta / GlobalMention; mantener FK de autor; eventual FK de usuario solo tras auditoría |
| createdAt, updatedAt | BIGINT ms Unix; copiar, no sustituir por fecha de importación |
| status | VARCHAR(20); preservar literal histórico, sin convertir pending/done/reported a active |
| workspaceId, projectId | BIGINT con FK existentes; contexto explícito a cualquier profundidad |
| visibility | VARCHAR(12) nullable; explícita para raíces, NULL para hijos importados sin dato propio; herencia propuesta |
| attributes | JSON íntegro; no sobrescribir claves para acomodar migración |

Reglas propuestas: parentId no puede apuntar al propio post ni formar ciclos; nuevas respuestas comparten workspace/proyecto del padre. Una raíz no requiere clasificación. Ser comentario significa tener parentId, no clasificación comment. Hashtags a cualquier profundidad. Visibilidad efectiva de hijos importados se hereda hasta una raíz, sin otorgar acceso mayor al contexto/ancestros. Es propuesta, no garantía de autorización ya implementada. Anomalías históricas se aíslan para revisión, sin normalizarlas silenciosamente.

### 4.2 Clasificaciones y capacidades independientes

- `post_classifications`: postId BIGINT FK posts, code VARCHAR(64), createdAt BIGINT nullable para importaciones sin fecha propia; PK(postId,code), índice(code,postId). Valores iniciales insight y brick. Cero o varias filas por post. Las fuentes de comentarios no generan clasificación obligatoria. importedAt pertenece al mapping y no simula fecha histórica de clasificación.
- `post_capabilities`: postId BIGINT FK posts, code VARCHAR(64), configuration JSON, createdAt BIGINT nullable; PK(postId,code), índice(code,postId). Solo se define time_tracking. No requiere ni implica brick/insight. Configuration vacía válida. No diseñar capacidades futuras.
- Categoría de brick (General/Testing/etc.) es distinta de clasificación brick. Conservar texto exacto en `post_brick_details(postId PK/FK, category VARCHAR(128) NOT NULL)`. Mantener brick_categories como diccionario global de sugerencias, sin convertir nombres en clasificaciones obligatorias ni reemplazar texto por FK al catálogo.

Con historial time se propone time_tracking explícita. Bricks sin tiempo admiten iniciar por primera vez desde UI actual: para preservar ese control, se recomienda habilitar capacidad a todos los bricks importados por política explícita de transición, sin regla estructural permanente brick → tiempo. Alternativa: habilitarla en primera acción mediante adaptador legado autorizado (ver 7). No crear mediciones por habilitar capacidad. Una unidad puede tener insight y brick y time_tracking a la vez; también time_tracking sin ninguna clasificación.

### 4.3 Registros horarios directamente en posts

`post_time_entries`: id BIGINT PK autoincremental, postId BIGINT NOT NULL FK posts, ordinal BIGINT NOT NULL (orden estable por post), startedAt BIGINT NULL, finishedAt BIGINT NULL, millis BIGINT NOT NULL, label TEXT NULL, createdAt BIGINT NULL, reported BOOLEAN NULL, provenance VARCHAR(32) NOT NULL, sourcePayload JSON NOT NULL. UNIQUE(postId,ordinal), índice(postId,finishedAt). reported NULL solo para importaciones sin evidencia; nuevos registros false/true. provenance: imported_interval, legacy_aggregate o unknown; para nuevas operaciones timer/manual/initial_duration si hay evidencia de su creación.

`post_time_snapshots`: postId PK/FK, originalTime JSON NOT NULL, importedAt BIGINT NOT NULL. Conserva totals y claves no representadas, sin diseñar otras mediciones. attributes original sigue intacto; snapshot permite comparación estable antes de editar. No sumar snapshot + entries: es evidencia, no otro registro de trabajo. Para fuentes antiguas originalTime conserva el contenedor original, sin simular estructura moderna.

finishedAt NULL solo indica timer activo si hay startedAt y semántica de intervalo; legacy_aggregate sin ambas fechas no es timer. Mantener máximo un intervalo abierto por post mediante validación/concurrencia adaptadas a la nueva persistencia. Totales operativos derivan de entries; el adaptador reconstruye attributes.time y conserva ordinal para measurementIndex. Agregados sin fechas no tienen proyección sin pérdida al contrato actual de intervalos: conservar JSON/compatibilidad hasta resolver, sin fabricar fechas para satisfacer DTO.

### 4.4 Hashtags y menciones

Reutilizar tags/taggables con postId según 2. Agregar postId nullable a mentions conservando globalMentionId, identidad y par de origen. No modificar global_mentions de usuarios/proyectos ni enlaces HTML de etiquetas. No diseñar tablas de votos u otras mediciones.

## 5. Correspondencia de migración — propuesta, no ejecutada

### 5.1 Correspondencia persistente

`post_source_mappings`:

| Campo / clave | Definición propuesta |
| --- | --- |
| sourceType | VARCHAR(32): post, post_comment, insight, insight_comment, insight_brick; literales parentType |
| sourceId | BIGINT, id original |
| postId | BIGINT NOT NULL FK posts.id |
| sourceUid | VARCHAR(50) NOT NULL, uid público original |
| sourcePayload | JSON NOT NULL, fila completa incluidas columnas no modeladas y NULL |
| importedAt | BIGINT NOT NULL, fecha de copia, nunca fecha del contenido |
| Claves | PK(sourceType,sourceId); UNIQUE(sourceType,sourceUid); UNIQUE(postId) para una fuente por unidad migrada; índice(sourceUid) no único |

sourceType → tabla SQL queda fijado por 2; no construir nombres SQL desde entrada libre. Mapping persiste después de migrar y no se recalcula por posición, orden o máximos. Reejecuciones usan la misma clave de origen, sin nuevos posts duplicados. Snapshot conserva estructura, texto y NULL. Auditar BIGINT fuera de rango seguro JS antes de usar Number para IDs/fechas.

Ejemplo ilustrativo: (post,7) → postId 7; (post_comment,7) → postId 501; (insight_brick,7) → postId 502. Los 501/502 son asignados y persistidos, no deducidos mediante offset fijo. Raíces existentes también tienen mapping.

### 5.2 Origen → destino

| Origen | Destino / regla |
| --- | --- |
| posts.id | posts.id conservado; mapping(post,id) |
| posts_comments.id | nuevo posts.id; mapping(post_comment,id) |
| posts_insights.id | nuevo posts.id; mapping(insight,id); clasificación insight |
| insights_comments.id | nuevo posts.id; mapping(insight_comment,id); sin clasificación obligatoria |
| insights_bricks.id | nuevo posts.id; mapping(insight_brick,id); clasificación brick |
| posts sin parentId | parentId NULL |
| posts_comments.parentId, posts_insights.parentId | mapping(post,parentId) → posts.parentId |
| insights_comments.parentId, insights_bricks.parentId | mapping(insight,parentId) → posts.parentId |
| uid de todas | posts.uid si no colisiona; sourceUid inmutable para contrato antiguo |
| userId, authorId | Copia exacta; no crear autores sustitutos |
| createdAt, updatedAt, status | Copia exacta de literales/fechas |
| workspaceId, projectId | Copia exacta; validar sin sustituir contexto |
| markdownSource, htmlSource | Copia exacta; sin re-render ni reinyección de etiquetas |
| attributes | Copia completa y snapshot en mapping; normalización horaria separada y verificable |
| posts.visibility | Copia exacta |
| Falta de visibility en hijos | NULL con herencia propuesta, sin inventar valor histórico |
| posts_comments.hashtags / mentions | Snapshot sourcePayload, conservando NULL/texto; contrastar con referencias, no asumir equivalencia ni reindexar a ciegas |
| insights_bricks.category | post_brick_details.category exacta; catálogo existente conservado |
| attributes.time.measurements[i] | post_time_entries ordinal i y payload completo; ver 3.3 |
| attributes.time.totals / claves extra | post_time_snapshots.originalTime y attributes preservado; contrastar sumas |
| attributes.measurements.time antiguo | Agregado con fechas desconocidas salvo evidencia; no duplicar si ya convertido |
| attributes.description/category antiguos | Conservar original; proyectar descripción/categoría solo con evidencia de estructura; no retirar claves en copia |
| posts_insights.votes | Tabla original y sourcePayload; sin función/tabla de votación destino |
| taggables.parentType + parentId | Resolver mapping → taggables.postId; preservar campos originales, tagId y metadatos |
| mentions.parentType + parentId | Resolver mapping → mentions.postId; preservar globalMentionId y metadatos |

### 5.3 IDs públicos, enlaces y coexistencia

Auditar UID repetidos entre tablas antes de asignar canónicos globales. Conservar todos en mapping incluso si coinciden entre tipos. Ante colisión, mantener UID de posts raíz y generar canónico nuevo para importado en conflicto; endpoints antiguos resuelven **tipo conocido por ruta + sourceUid**, no solo canónico. Una ruta de insight no debe devolver raíz con mismo UID.

Conservar `/webapp/posts/<uid>` y `/webapp/insights/<uid>` (rutas privadas posts/:ref e insights/:ref), y uid/parentUid de cada contrato antiguo. Adaptador resuelve IDs internos y emite UID original del padre en namespace esperado. Copiar htmlSource y tags.link sin cambios; inventariar enlaces embebidos/referencias dentro de attributes antes de reescribir. El análisis estático no enumera URLs libres guardadas en datos.

No eliminar ni renombrar tablas/datos originales. Las cuatro tablas hijas siguen conservadas. Ampliar posts cambia superficie de consultas: **antes de cargar respuestas allí**, las listas antiguas deben filtrar raíces y sus conteos/joins usar correspondencias; de otro modo aparecerán respuestas como publicaciones raíz. No importar mientras los lectores interpreten todas las filas de posts como raíces.

Orden propuesto para una etapa posterior: registrar identidades, resolver padres, clasificaciones/capacidades/referencias, extraer tiempo, reconciliar. Hace falta decidir cómo coordinar escrituras concurrentes; conservar tablas antiguas no las sincroniza automáticamente. No habilitar doble escritura sin transacciones/reconciliación y alcance acordados.

## 6. Compatibilidad y reglas existentes

### Confirmado en backend y consumo frontend de solo lectura

Se consultaron sin modificar `khara-webapp-v2/src/app/commons/services/post.service.ts`, `commons/models/interfaces/responses/post.response.ts`, `privates/private-routing.module.ts`, editor y componente brick-time. Se observaron cambios locales preexistentes en brick-time.ts y su spec, que este paso no modifica ni revierte. Evidencia del checkout local, no de versión desplegada.

| Contrato del cliente | Conservación propuesta |
| --- | --- |
| Alta raíz: content, workspaceUid, projectUid opcional | Resolver menciones/proyecto predeterminado y visibilidad como hoy |
| Editar raíz: content, postUid, projectUid, workspaceUid | Mantener formato y manejo de respuesta; no reinterpretar UID como BIGINT |
| Altas de respuestas: content, parentUid, workspaceUid | Mantener rutas y tipo de padre del contrato |
| Editar respuestas: content, replyUid, parentUid, workspaceUid | Mantener autoría, vínculo exacto padre/proyecto/workspace y errores |
| Brick: category opcional; duration/reported de compatibilidad | Categoría libre, edición preserva historial; publicación no exige tiempo |
| Tiempo: action, measurementIndex opcional, startedAt/finishedAt para add | Mantener acciones, ms Unix, índice basado en orden y respuesta BasePostDTO actualizada |
| Categorías: GET con ref insight y workspaceUid | DTO {id,name}, validación de contexto aunque catálogo sea global |
| BasePostDTO/BasePostResponse | uid, rawContent, htmlContent, created/updated y labels, displayName, mention, totalComments/totalInsights; type opcional, attributes/category para bricks |
| FullPostDTO/FullPostResponse | project, comments e insights separados; no sustituir por children genérico en contrato antiguo |
| FullInsightDTO/InsightResponse | parentUid, project, comments, bricks y totalBricks |
| Listas | collection, totalRows, length, page, perPage, totalPages, hasPrevious, hasNext; page desde 0, offset = page * perPage; raíces id DESC |
| Respuesta/errores | Envoltorio status/payload, semántica 400/403/404/409 y validaciones de payload.uid del cliente |

PostService ignora payload de alta/edición raíz y edición simple. Altas de respuestas requieren uid y agregan unidad a lista; tiempo reemplaza brick tras éxito. type legado (`comment`, `insight`, `insight-comment`, `insight-brick`) es proyección compatible, no clasificación única del dominio nuevo. Importados proyectan según sourceType; para nuevos posts con múltiples clasificaciones debe decidirse la proyección, sin crear varias copias de una unidad.

JWT Bearer, usuario y policies por roles se resuelven en PolicyMiddleware; acciones se evalúan por resourceName/método. Server verifica x-api-key según configuración. Dispatcher envía HTTP 200 para resultados despachados y el estado de aplicación vive en body.status; cliente consume status/payload. No cambiar transporte como parte de unificar.

Respuestas validan workspace no deleted, padre disponible, GlobalMention activo y proyecto no deleted del mismo workspace. Ediciones exigen userId principal y coincidencia padre/proyecto/workspace. Lectura de insight/bricks exige además raíz active consistente. Consultas directas de comentarios de insight solo active; bricks/insights excluyen deleted. Preservar historial/concurrencia de tiempo, descripción editable frente a HTML generado y menciones de proyecto.

### Discrepancias confirmadas, sin corrección en este paso

- Defaults SQL/modelo/handler difieren (1.4). No usar default SQL para reinterpretar filas existentes.
- countByParentIdIn de insights no filtra status; detalle excluye deleted. Inverse joins de comentarios tampoco filtran estado. Los contadores no tienen una regla uniforme.
- UpdatePostHandler raíz no comprueba explícitamente autoría ni igualdad de contexto de entidad con UID recibidos, a diferencia de factories de respuestas. No afirmar garantías presentes en toda API.
- PolicyMiddleware valida policies, pero no se observa validación de membresía por workspace/proyecto en cada handler relevado. Mantener autenticación/policies; acceso a profundidad arbitraria necesita diseño explícito, sin ampliar permisos accidentalmente ni mezclar corrección de autorización con copia de datos.
- Update raíz añade taggables y no reemplaza mentions; respuestas sí reemplazan referencias. Unicidad global de tags.name difiere de búsqueda por usuario/categoría.
- ReadInsightsCollectionHandler y PaginatedPostsHandler carecen de ruta activa.

**Propuesta:** capturar contratos con pruebas de compatibilidad al implementar adaptadores; resolver cambios deliberados de filtros/permisos/estados/referencias por separado. Importación preserva valores. Este documento no autoriza perpetuar fallos ni corregirlos de forma encubierta.

## 7. Preparación del siguiente paso

### Cambios aditivos propuestos

1. Agregar parentId nullable autorreferenciado a posts e índices (parentId,status,id), (projectId,parentId,status,id) y (userId,parentId,status,id); evaluar redundancia con índices actuales mediante planes de consulta posteriores. Sin cascada destructiva.
2. Crear post_source_mappings antes de copiar; conservar raíces e identidades. Crear post_classifications, post_capabilities y post_brick_details.
3. Crear post_time_entries y post_time_snapshots según 4.3. Sin tablas para votos ni mediciones futuras.
4. Agregar postId nullable e índices/FK a taggables y mentions, manteniendo columnas/filas. No imponer unicidad que descarte duplicados sin auditoría. Para nuevas unidades sin proyección antigua, los campos NOT NULL parentType/parentId actuales requieren una política: conservar par post/nuevo postId solo tras adaptar lectores/borrados antiguos para no confundirlo con raíces. Durante coexistencia, una alternativa es usar un discriminator nuevo para ese caso, validado por los adaptadores. No escribir pares ficticios sin definir lectores.
5. Permitir herencia por NULL requeriría flexibilizar posts.visibility: cambio de restricción adicional a las adiciones, aunque conserva valores. No presentarlo como mera columna nueva; la alternativa estrictamente aditiva figura abajo.
6. Futuras migraciones irían en archivos nuevos con changeset según README, sin editar firmas de 01–12. Infra ejecuta MigrationManager.initialize al arrancar: preparar archivos ejecutables en migrations requiere paso autorizado y entorno controlado. Este PASO 1 no crea SQL ni arranca aplicación.

DDL no basta para cargar datos: antes de importar deben estar preparados adaptadores y filtros de raíces compatibles. La próxima etapa puede limitarse a esquema aditivo con tablas vacías; backfill/activación quedan para pasos posteriores explícitos. Las decisiones siguientes bloquean las operaciones indicadas, no este relevamiento.

### Decisiones y comprobaciones pendientes

| Tema / qué condiciona | Alternativa recomendada y fundamento | Alternativa viable |
| --- | --- | --- |
| Esquema desplegado y datos; bloquea backfill seguro | Auditoría de solo lectura autorizada en copia/local: versión MySQL, SHOW CREATE TABLE, changelog, conteos/estados, NULL/0, huérfanos, contextos, BIGINT fuera de rango JS; verificar respaldo de 10 | Dump anonimizado y auditoría offline. No inferir aplicación de migraciones desde Git |
| UID repetidos entre fuentes; bloquea asignación pública | Mapping tipado + UID nuevo solo ante colisión, aliases por ruta | UID nuevo para todos los importados y aliases para todos; mayor cambio interno, mismo contrato público |
| Visibilidad heredada; condiciona DDL/autorización | NULL expresa ausencia real, herencia y restricción por contexto/ancestros | Estrictamente aditivo: agregar visibilityMode explicit/inherit y conservar columna NOT NULL; valor del hijo materializado para compatibilidad, marcado derivado y nunca histórico |
| Estados/filtros divergentes; bloquea activación sin efectos inesperados | Copiar literales y mantener proyecciones; acordar corrección de contadores por separado | Matriz nueva de filtros como cambio funcional explícito con pruebas/aceptación, no durante copia |
| Tiempo en bricks sin historial; condiciona UI | Habilitar time_tracking explícita a importados por política transitoria; no crear entries ni regla permanente por clasificación | Habilitar capacidad en primera acción mediante adaptador legado y misma autorización |
| Agregados/intervalos de origen no demostrable; bloquea normalización completa | Payload y agregados sin fechas, provenance explícita; reconciliar respaldo sin duplicar suma | Conservar casos en JSON y diferir extracción; migrar solo time validado, sin inventar fechas para DTO |
| Historial malformado o totals discrepante; bloquea recalcular sin pérdida | Snapshot y entries fieles; reportar y diferir escritura horaria del caso hasta revisión | Conservar JSON íntegro sin extraer; nunca corregir/borrar silenciosamente |
| Escrituras concurrentes; bloquea backfill/activación | Ventana controlada de pausa de escrituras para copia/reconciliación/cambio de lectores; menor complejidad | Doble escritura transaccional y reconciliación en etapa dedicada; conservar tablas no equivale a sincronizar |
| Duplicados de taggables / name global | Vincular por fila sin cambiar tags/usageCount; documentar anomalías | Deduplicar solo proyección conservando filas; unicidad/normalización se decide aparte |
| Campos polimórficos en nuevas unidades; condiciona coexistencia | Adaptadores antes de usar par post/nuevo ID; postId es relación canónica | Discriminator nuevo durante transición, con lectores compatibles; no reutilizar un namespace todavía ambiguo |
| Padres NULL/0, huérfanos, ciclos, contexto cruzado | Reportar y diferir activación sin convertir a raíz; conservar datos y mapping cuando identidad determinada | Zona de revisión con payload y vínculo pendiente; nunca enlazar por simple igualdad de ID entre fuentes |
| Múltiples clasificaciones en contratos legados | Proyectar importados por origen y definir política de nuevas combinaciones antes de exposición | No incluir combinaciones nuevas en listas legadas hasta definir API compatible; sin frontend en este paso |

### Criterios para una etapa de datos posterior (no ejecutados)

- Una correspondencia por fila de origen, incluidos estados no activos; ninguna identidad solo por sourceId; reejecución sin duplicados.
- Padres resueltos con tipo correcto, sin ciclos/cruces creados por proceso; anomalías listadas y originales intactos.
- Comparación de contenido, autoría, fechas, estados, atributos y referencias por fila; aliases/enlaces resuelven misma unidad.
- Cada taggable/mention conserva identidad y destino equivalente; conteos de asociaciones preservados sin reinterpretar usageCount.
- Tiempo con mismo orden, abiertos, reported y millis; snapshots reconciliados; ningún timestamp de trabajo fabricado ni doble suma de respaldos/agregados.
- Listas de raíces excluyen respuestas; contratos y autor/workspace/proyecto/concurrencia se verifican con pruebas de backend en entorno aislado.

## 8. Verificación de este entregable

Se inspeccionaron estáticamente migraciones, modelos, repositorios, handlers, servicios, contratos y consumidores frontend citados. Se separaron hechos, propuestas y límites. Resultados de la verificación documental:

- Enlaces Markdown locales: todos resuelven, 0 destinos inexistentes.
- Los 2 bloques JSON se parsean correctamente. Ejemplo moderno: intervalos cerrados coinciden con sus millis; suma 9000000 ms, reportado 7200000 ms; abierto excluido de totales.
- Sin líneas con espacios finales. git diff --check sin errores en cambios rastreados; se comprobó también el archivo nuevo, que aún no está rastreado.
- Estado del backend: únicamente este documento nuevo; sin cambios en src, migrations, dependencias ni tests. Frontend conserva los dos archivos modificados preexistentes indicados en 6.

No se ejecutaron tests de aplicación, build, servidor, conexión a base ni migraciones: no hay cambios ejecutables en este paso. No se modificó frontend ni sus cambios locales preexistentes.
