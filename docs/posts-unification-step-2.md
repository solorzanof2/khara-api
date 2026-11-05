# Posts unificados — PASO 2: esquema aditivo

Fecha: 2026-11-02. Basado en el [relevamiento del PASO 1](posts-unification-step-1.md).

## Alcance implementado

[13-unified-posts-additive-schema.sql](../migrations/13-unified-posts-additive-schema.sql) prepara almacenamiento, sin copiar contenido ni referencias, asignar clasificaciones/capacidades, cambiar modelos/servicios/handlers ni agregar endpoints. No contiene INSERT/UPDATE/DELETE ni altera/elimina columnas previas. Las únicas filas escritas al aplicar son los registros técnicos de databasechangelog que crea el ejecutor habitual. Ninguna base de aplicación o producción fue utilizada en esta tarea.

Se mantiene MySQL, TypeScript y el ejecutor DeepCORE. Se eligió sintaxis compatible con MySQL 5.7.31 y 8.x: JSON sin default de expresión, índices B-tree, ENUM para vocabularios cerrados y FK RESTRICT. No se depende de CHECK (MySQL 5.7 no los aplica), índices parciales ni funciones de MySQL 8. No se añadieron dependencias. Solo se probó realmente MySQL 5.7.31; compatibilidad con 8.x es estática.

## Decisiones finales y tablas

### Ampliar posts existente

Se conserva `posts`, su PK id autoincremental, UID público único, markdownSource/htmlSource, attributes JSON, autoría userId/authorId, fechas ms Unix, status, proyecto, workspace y visibility. Se agregan:

| Elemento | Uso y compatibilidad |
| --- | --- |
| parentId BIGINT NULL | FK autorreferenciada, sin cascada; NULL identifica raíz. Todas las filas anteriores quedan con NULL, sin reconstruir relaciones |
| visibilityMode ENUM(explicit,inherit), default explicit | Conserva visibility NOT NULL y valores previos; modo explícito para escritores actuales. Permite representar herencia de hijos sin atribuirles una visibilidad histórica |
| Índices | (parentId,status,id), (projectId,parentId,status,id), (userId,parentId,status,id), para hijos/listas de raíces futuras |

Agregar estas columnas no cambia las consultas actuales: no se agregan respuestas a posts ni se alteran modelos TypeScript. QueryManager deriva campos del modelo, no introspecta todas las columnas; sus INSERT antiguos reciben defaults y sus UPDATE no escriben las columnas nuevas. Esto se verificó con PostRepository real y SQL en la base aislada.

No se justifica una segunda tabla general de contenido para este paso. **Antes de un futuro backfill**, deben adaptarse listas/conteos para distinguir raíces e hijos y proyectar contratos antiguos. Las FK actuales de proyecto/workspace/autor se mantienen. No se agrega una FK nueva sobre posts.userId: podría rechazar datos históricos no auditados.

visibilityMode no implementa autorización ni herencia en runtime. Para un futuro hijo con inherit, visibility será un valor materializado de compatibilidad (por ejemplo la efectiva del padre), marcado como derivado; los lectores nuevos deberán resolver herencia y límites de acceso. Cambiar políticas de acceso, contexto cruzado o contadores queda fuera. El esquema no impide ciclos, self-parent ni contextos distintos por FK simple: requieren validación futura y auditoría; no se introduce un trigger con reglas de negocio sin definir.

### Clasificaciones, categoría y capacidades

| Tabla | Estructura y restricciones |
| --- | --- |
| post_classifications | postId FK posts, code ENUM(insight,brick), createdAt nullable; PK(postId,code), índice(code,postId). Cero o varias clasificaciones, sin duplicados |
| post_brick_details | postId PK/FK posts, category VARCHAR(128). Conserva la categoría textual del brick, distinta de su clasificación. No sustituye brick_categories ni obliga a usar el catálogo |
| post_capabilities | id PK, postId FK posts, code VARCHAR(64) ASCII binario, status ENUM(enabled,disabled) default enabled, configuration JSON nullable, createdAt/updatedAt nullable; UNIQUE(postId,code), índice(code,status,postId) |
| post_capability_history | id PK, capabilityId FK post_capabilities, revision BIGINT UNSIGNED, status enabled/disabled, configuration JSON nullable, recordedAt BIGINT; UNIQUE(capabilityId,revision) |

Comentario se expresa solo por parentId. No hay FK entre clasificaciones/capacidades ni dependencia de tiempo hacia brick. `time_tracking` es la única capacidad acordada; code permite asociarla sin sembrar datos ni diseñar nuevas funcionalidades. ASCII binario evita que dos escrituras con igual código exacto creen asociaciones duplicadas; los escritores futuros deben usar códigos canónicos.

Deshabilitar una capacidad conserva su fila; no borra registros horarios. El historial permite guardar cada estado/configuración sin duplicar la asociación. Las revisiones ordenan cambios aunque dos compartan el mismo ms; recordedAt representa el cambio registrado, no una fecha histórica inventada. Un futuro escritor debe insertar la revisión y actualizar estado/configuración en **una transacción**, con control de concurrencia; no se implementan esos escritores ni triggers en este paso. La tabla permite conservar historial, pero no captura automáticamente cambios hechos con SQL directo; tampoco es un sistema de auditoría inmutable frente a administradores.

createdAt/updatedAt de asociaciones admiten NULL cuando una importación futura no conozca esas fechas; no usar la fecha de copia como fecha de clasificación/capacidad. La elección de habilitar tiempo en bricks sin historial sigue pendiente para el backfill/adaptador, no bloquea crear tablas vacías.

### Almacenamiento horario

`post_time_entries` referencia directamente posts mediante postId, **sin FK a brick ni a post_capabilities**:

| Campo | Tipo / significado |
| --- | --- |
| id | BIGINT PK autoincremental; identidad estable del registro |
| postId | BIGINT NOT NULL FK posts |
| ordinal | BIGINT UNSIGNED; UNIQUE(postId,ordinal), conserva orden de measurements e índice usado por cliente |
| kind | ENUM(interval,aggregate), obligatorio; distingue intervalo de agregado sin fechas |
| description | LONGTEXT nullable, descripción propia del registro solicitada en PASO 2; no confundir con label ni con descripción del post |
| startedAt, finishedAt | BIGINT nullable, ms Unix originales; ambas NULL en agregado sin evidencia de fechas |
| millis | BIGINT UNSIGNED NOT NULL, duración numérica canónica en milisegundos, sin default que simule tiempo registrado |
| label | TEXT nullable; etiqueta original para preservación, no fuente numérica canónica |
| createdAt | BIGINT nullable; fecha original de alta del tramo si existe |
| reported | BOOLEAN nullable: true/false original, NULL = desconocido; no confundir con totals.reported, que es string |
| provenance | ENUM(imported_interval,legacy_aggregate,unknown,timer,manual,initial_duration), default unknown; procedencia explícita si puede demostrarse |
| sourcePayload | JSON nullable, elemento original completo al importar; NULL permitido en registros nuevos sin fuente histórica |

Índice (postId,finishedAt). FK RESTRICT. `post_time_snapshots`: postId PK/FK, originalTime JSON NOT NULL e importedAt BIGINT NOT NULL. Es evidencia del contenedor original con totals y claves desconocidas; no otro tiempo acumulable. Las duraciones positivas sin inicio/fin son representables sin inventar fechas. Un intervalo abierto conserva startedAt y finishedAt NULL; un agregado sin ambas fechas **no** se interpreta como temporizador activo. No se crean tramos ni se calculan totales.

No hay description en measurements actual: al migrar se conserva NULL, sin copiar la descripción general del brick como si fuera una descripción histórica de cada tramo. No se infiere reported, ni modo timer/manual de intervalos sin procedencia demostrable. El JSON original y attributes permanecen disponibles para datos malformados o discrepancias; no forzar valores inventados para insertarlos. Restricciones de rango seguro JS, orden de fechas, máximo un abierto, reported booleano y coherencia kind/fechas corresponden a futuros validadores; BOOLEAN de MySQL admite otros enteros y se documenta este límite. No hay cálculos, temporizadores, otras mediciones o votaciones.

### Hashtags y menciones

Se reutilizan `tags` y `taggables`. Solo se agrega a taggables postId BIGINT nullable, FK posts con RESTRICT e índice(postId,tagId). A mentions se agrega postId nullable, FK RESTRICT e índice(postId,globalMentionId), para no dejar fuera referencias existentes a personas/proyectos. No se cambia global_mentions. Las filas antiguas permanecen sin postId y sus pares parentType/parentId intactos.

| Representación | parentType / parentId | postId |
| --- | --- | --- |
| Histórica actual | post/post_comment/insight/insight_comment/insight_brick + ID de su tabla | NULL en este paso |
| Histórica enriquecida en etapa posterior | Mismo par de origen, nunca reinterpretado | Resolver mediante mapping tipado, no igualdad numérica |
| Nueva unificada, en etapa posterior | **unified_post** + posts.id | El mismo posts.id |

Se reserva unified_post para evitar que `post` histórico y un nuevo namespace se confundan. El índice polimórfico existente sigue distinguiendo el tipo incluso con IDs iguales. Los lectores nuevos usan postId; los antiguos nunca reciben referencias nuevas por coincidencia con otro tipo. No se crea otra tabla de hashtags ni unicidad sobre asociaciones históricas que pueda descartarlas. No se cambia tags.name, usageCount, HTML ni links.

La igualdad parentId = postId cuando parentType = unified_post es una regla de escritura explícita para adaptadores futuros; no se declara CHECK ignorado en 5.7 ni trigger que altere el flujo actual. Las FK protegen existencia de postId, no resuelven referencias polimórficas ni comprueban por sí solas esa igualdad. No escribir asociaciones unificadas hasta implementar y probar ese adaptador.

### Correspondencia persistente

`post_source_mappings` tiene sourceType ENUM de los cinco tipos, sourceId BIGINT, postId FK posts, sourceUid VARCHAR(50), sourcePayload JSON con fila íntegra e importedAt BIGINT. PK(sourceType,sourceId), UNIQUE(sourceType,sourceUid), UNIQUE(postId), índice no único(sourceUid). Una fila de origen corresponde a un post; igual número o UID en tablas distintas sigue permitido.

| sourceType | Tabla de origen |
| --- | --- |
| post | posts |
| post_comment | posts_comments |
| insight | posts_insights |
| insight_comment | insights_comments |
| insight_brick | insights_bricks |

No hay FK al ID de origen porque es polimórfico; las fuentes se conservan. Las restricciones previenen duplicar mapping o asignar dos fuentes al mismo destino, pero la **futura** copia deberá reservar mapping y post en una transacción: un INSERT de post confirmado por separado podría dejar huérfano al fallar mapping. No basta con INSERT IGNORE ni con el constraint para garantizar reejecución idempotente de una importación entera.

Los IDs raíz pueden conservarse como propuso PASO 1; otros reciben IDs nuevos. sourceUid preserva alias por tipo; posts.uid canónico conserva unicidad global. Resolver colisiones reales y enlaces requiere auditoría antes de importar: no se renombra ningún UID ahora. sourcePayload conserva columnas SQL no modeladas, datos desconocidos y votos históricos sin implementar votaciones.

## Aplicación y reversión

La migración 13 tiene diez changesets (una operación DDL por changeset), sin modificar 01–12. MigrationKernel registra firmas y omite changesets aplicados; **el DDL no es idempotente por sí mismo**. No ejecutar el archivo SQL dos veces directamente. MySQL 5.7 hace commit implícito de DDL y el kernel no registra un changeset antes de ejecutarlo: un fallo después del DDL y antes de registrar changelog exige inspección/reconciliación manual, no IF NOT EXISTS que esconda un esquema incompleto.

Infra ejecuta migraciones automáticamente al arrancar. No se arrancó la aplicación ni se ejecutó este archivo sobre su configuración. Antes de desplegar/iniciar este checkout en un entorno real, se necesita el paso de aplicación autorizado, copia de seguridad, revisión del esquema efectivo y ventana para locks de ALTER. No ejecutar el rollback desde el scanner de migrations.

[Rollback de prueba](sql/rollback-13-unified-posts-test-only.sql) queda fuera de migrations. Es manual y solo para una base aislada con 13 completamente aplicada. Crea un procedimiento temporal de uso que aborta antes del DDL si hay asociaciones/capacidades/historial/tiempos/mappings, postId de referencias, parentId o visibilidad heredada. Si está vacío, retira únicamente tablas/columnas/índices/FK nuevos y diez entradas exactas del changelog. Las raíces y filas originales permanecen.

Con datos nuevos **no hay reversión destructiva automática**: exportar y planificar restauración/reconciliación sin perder información; nunca desactivar la guardia, deshabilitar FK ni borrar filas para forzarla en una base real. La prueba elimina solo sus propios fixtures. DDL no transaccional: si rollback se interrumpe puede quedar parcial y requiere inspección manual. Si CALL aborta, el procedimiento sigue creado; retirarlo antes de reintentar CREATE. No restaurar toda una base desde un respaldo antiguo sin contemplar escrituras posteriores.

## Verificación ejecutada

Se detectaron servicios WAMP de MySQL/MariaDB, pero **no se usaron sus conexiones ni datos**. Solo se usó el binario MySQL 5.7.31 para inicializar una instancia independiente bajo TEMP/khara-schema-step2-<GUID>/data, sin defaults externos, bind 127.0.0.1 y puerto libre. Sin .env de aplicación. La instancia se detiene al finalizar. Los datos que se crearon/copiaron como fixtures existen exclusivamente en la prueba, no son migración de contenido de KHARA.

Verificador reproducible: [tests/integration/unified-posts-schema.cjs](../tests/integration/unified-posts-schema.cjs). Requiere una instancia dedicada con datadir terminado en `khara-schema-step2-<32 hex>/data/`, root local sin contraseña generado por initialize-insecure y puerto explícito. Se rechaza cualquier otro datadir antes de crear la base. Ejecución PowerShell, después de iniciar esa instancia aislada:

```powershell
$env:KHARA_SCHEMA_TEST_PORT = '<puerto de la instancia temporal>'
node tests/integration/unified-posts-schema.cjs
```

El script no lee .env; crea una base aleatoria `khara_step2_test_<timestamp>`, aplica copias de migraciones con el MigrationManager real, ejercita restricciones y rollback, reaplica 13 y elimina solo su base y carpeta temporal de copias. No inicia servidor HTTP. Usa únicamente mysql/ts-node ya presentes en el proyecto. No es parte del arranque ni de la suite unitaria habitual.

Resultados:

- **MySQL 5.7.31 real:** aplicación de 01–12 y luego 13, reejecución con firmas/changelog sin duplicación; tablas nuevas vacías y datos/asociaciones originales sin cambios.
- Fixtures con mismo ID y UID en tablas de origen distintas: mapping tipado permite destinos distintos; rechaza duplicar origen, UID por tipo o destino.
- FK de padre y tablas nuevas/referencias, unicidad de clasificaciones/capacidades/revisiones/ordinales y UID, rechazo de eliminaciones referenciadas. Múltiples clasificaciones y capacidad sin clasificación; agregado con fechas/reported NULL y millis numérico preservado.
- Rollback bloqueado con un dato de prueba; tras retirar ese fixture, reversión del esquema vacío preservando contenido previo y reejecución posterior de 13 correctas.
- PostRepository actual guarda/lee con columnas nuevas omitidas, y lee después de rollback; backend no cambia su contrato.
- `node node_modules/typescript/bin/tsc -p tsconfig.build.json --noEmit`: correcto, sin emitir dist.
- `node node_modules/jest/bin/jest.js --runInBand --silent`: 18 suites, 209 pruebas correctas, con persistencia simulada; no equivalen a una prueba de endpoints desplegados.

Límite detectado al reconstruir el historial: con base utf8mb4_unicode_ci, migración **10 previa** falla con ER_CANT_AGGREGATE_2COLLATIONS al comparar categoría/UID con collations distintas. Se usó utf8mb4_general_ci para reconstruir 01–12, que pasó íntegramente; no se corrigió ni cambió 10. La 13 añade solo FK numéricas y no hace comparaciones de texto entre tablas. El esquema/collation efectivo de una base existente necesita auditoría antes de aplicar, no queda certificado por esta prueba.

## Pendientes que condicionan el siguiente paso

- Auditoría del esquema desplegado y de datos reales: UID duplicados entre fuentes, huérfanos, rangos BIGINT, estados, contexto, respaldo de 10 e historial horario inválido. No bloquea DDL vacío, sí backfill seguro.
- Implementar adaptadores y filtros de raíces **antes** de copiar hijos a posts; mantener aliases por ruta y DTO del frontend sin ampliar permisos.
- Definir/implementar escrituras transaccionales de capability_history y mapping; validaciones de ciclos/contexto/visibilidad, pares unified_post y datos horarios. No hay automatismos de negocio en este paso.
- Acordar habilitación de time_tracking para bricks sin historial y política de proyección de posts con múltiples clasificaciones; ninguna capacidad se asignó por su clasificación.
- Mantener agregados sin fechas y snapshots, no reconstruir intervalos ni corregir diferencias sin evidencia; decidir tratamiento de casos anómalos antes de activarlos.
- Elegir coordinación de escrituras (pausa controlada o doble escritura transaccional) y política de activación; conservar originales no sincroniza futuras escrituras.

No se modificó frontend ni endpoints. No se trasladaron datos ni se ejecutaron cambios sobre producción. Este paso prepara exclusivamente el esquema y su documentación/verificación.
