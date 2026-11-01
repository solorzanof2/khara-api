# Bricks: categorías y tiempo

El catálogo compartido brick_categories tiene únicamente id y name. General es la categoría predeterminada. Los nombres del diccionario admiten hasta 128 caracteres y son únicos sin diferencias de mayúsculas o acentos. El editor consulta el diccionario completo y permite escribir una categoría propia: guardar o editar un brick nunca modifica brick_categories. Se retiró el endpoint público de alta; la edición del diccionario queda fuera de este circuito y reservada a administración. Los permisos de los endpoints siguen validando el insight, workspace y proyecto de contexto.

insights_bricks.category guarda el nombre. markdownSource guarda la descripción original y htmlSource su presentación con tiempo y los metadatos habituales del brick. No se copia categoría ni descripción en attributes. El backend conserva el nombre en insights_bricks.category y añade su hashtag en minúsculas al contenido renderizado, usando el indexador habitual de tags. El hashtag elimina acentos, espacios y signos que el indexador no admite. Por ejemplo, MiCategoria genera #micategoria. El markdownSource conserva el texto editable original para evitar acumular hashtags generados al editar. Este proceso nunca modifica brick_categories. Los hashtags escritos en el contenido mantienen su procesamiento habitual.

## Tiempo

attributes.time tiene measurements y totals. Cada medición contiene startedAt, finishedAt, label, millis, createdAt y reported. Una medición en curso tiene finishedAt: null y millis: 0. Solo los tramos finalizados cuentan en los totales.

totals contiene label, millis, createdAt, updatedAt y reported. reported es el tiempo reportado legible, calculado a partir de los tramos cuyo reported es true. Se usa updatedAt con la ortografía corregida del ejemplo. El cronómetro usa fechas del servidor. En la carga manual el cliente envía fechas convertidas desde su hora local a milisegundos Unix; el backend calcula duración, etiquetas y totales. El contador visual no modifica los tiempos del servidor.

Los bricks nuevos se pueden publicar sin configuración de tiempo: attributes no contiene time hasta registrar la primera medición. El editor de publicación/edición solo gestiona categoría y contenido. Para compatibilidad con clientes anteriores, una duración inicial explícita sigue creando un tramo finalizado: finishedAt es el momento de alta, startedAt es ese momento menos la duración. No se presenta como una sesión de cronómetro medida. Los clientes anteriores pueden enviarlo como ya reportado; por defecto queda sin reportar. Los tramos del cronómetro siempre empiezan sin reportar.

POST /api/v1/posts/insights/bricks/time acepta replyUid, parentUid, workspaceUid y action: start, finish, add o report. add requiere startedAt y finishedAt como milisegundos Unix enteros, con inicio no negativo, fechas válidas y fin posterior al inicio. Crea una medición finalizada sin reportar, calcula millis/label y actualiza los totales sin modificar otras mediciones ni el cronómetro activo. No restringe solapamientos ni fechas futuras. El servidor ignora millis, label o reported enviados en esta acción. Devuelve el brick actualizado con attributes.time; el frontend reemplaza el brick en la tabla solo tras confirmar el guardado. No requiere migraciones adicionales. report acepta measurementIndex para un tramo, o reporta todos los finalizados si se omite. No se permite iniciar dos veces, finalizar sin cronómetro activo ni reportar un tramo abierto. Las acciones se permiten al autor del brick y usan comparación atómica del estado anterior para evitar sobrescribir cambios de otra sesión. Un conflicto devuelve 409.

La edición de descripción y categoría conserva íntegro el historial; no permite reemplazar un total acumulado por una duración nueva. Los bricks anteriores sin tiempos se pueden editar sin inventar mediciones. Los atributos de otras unidades de medida se conservan.

## Migración

Aplicar 10-simplify-brick-categories-and-time.sql después de 08 y 09. Las migraciones anteriores permanecen sin cambios para respetar las firmas de databasechangelog. La migración 10 fue autorizada para prepararse con respaldos; no se ejecutó sobre la base de datos desde esta tarea.

Antes de convertir datos, crea insights_bricks_before_time_model con una copia completa de los bricks. Al finalizar conserva el catálogo anterior en brick_categories_previous. No elimina tablas de respaldo. El catálogo activo queda con id y name, fusionando nombres repetidos de proyectos diferentes. La columna category se amplía a 80 caracteres para conservar los nombres admitidos anteriormente.

Convierte los UID de categorías a nombres y la descripción original a markdownSource. Las duraciones antiguas pasan a un tramo manual sin reportar, usando la fecha de alta como final y derivando el inicio de su duración; no existe evidencia de un cronometraje histórico real. Retira solo las copias anteriores de categoría, descripción y tiempo agregado en attributes, conservando otras unidades de medición. Los tiempos ausentes siguen ausentes.

Aplicar 11-recreate-brick-categories.sql después de 10. Elimina y recrea brick_categories con id autonumérico y name VARCHAR(128) NOT NULL; carga únicamente General, Desarrollo, Testing y Análisis. Amplía insights_bricks.category a 128 caracteres. Los nombres ya guardados en los bricks se conservan. La migración queda preparada, sin ejecución sobre la base desde esta tarea.

Aplicar 12-expand-category-hashtags.sql después de 11: amplía tags.name a 128 caracteres para indexar categorías del largo máximo sin truncamiento. Conserva el índice único existente. No se ejecutó sobre la base desde esta tarea.
