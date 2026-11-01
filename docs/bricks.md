# Bricks: categorías y tiempo

El catálogo compartido brick_categories tiene únicamente id y name. General es la categoría predeterminada. Los nombres son únicos sin diferencias de mayúsculas o acentos y el alta usa una inserción atómica. Los permisos de los endpoints siguen validando el insight, workspace y proyecto de contexto.

insights_bricks.category guarda el nombre. markdownSource guarda la descripción original y htmlSource su presentación con hashtag y tiempo. No se copia categoría ni descripción en attributes. Los hashtags se derivan del nombre con la convención camelCase y se procesan con el indexador existente.

## Tiempo

attributes.time tiene measurements y totals. Cada medición contiene startedAt, finishedAt, label, millis, createdAt y reported. Una medición en curso tiene finishedAt: null y millis: 0. Solo los tramos finalizados cuentan en los totales.

totals contiene label, millis, createdAt, updatedAt y reported. reported es el tiempo reportado legible, calculado a partir de los tramos cuyo reported es true. Se usa updatedAt con la ortografía corregida del ejemplo. Las fechas y los cálculos se generan en backend; el contador visual no modifica los tiempos del servidor.

La carga inicial de duración crea un tramo finalizado: finishedAt es el momento de alta, startedAt es ese momento menos la duración. No se presenta como una sesión de cronómetro medida. Puede marcarse como ya reportado desde el formulario; por defecto queda sin reportar. Los tramos del cronómetro siempre empiezan sin reportar.

POST /api/v1/posts/insights/bricks/time acepta replyUid, parentUid, workspaceUid y action: start, finish o report. report acepta measurementIndex para un tramo, o reporta todos los finalizados si se omite. No se permite iniciar dos veces, finalizar sin cronómetro activo ni reportar un tramo abierto. Las acciones se permiten al autor del brick y usan comparación atómica del estado anterior para evitar sobrescribir cambios de otra sesión. Un conflicto devuelve 409.

La edición de descripción y categoría conserva íntegro el historial; no permite reemplazar un total acumulado por una duración nueva. Los bricks anteriores sin tiempos se pueden editar sin inventar mediciones. Los atributos de otras unidades de medida se conservan.

## Migración

Aplicar 10-simplify-brick-categories-and-time.sql después de 08 y 09. Las migraciones anteriores permanecen sin cambios para respetar las firmas de databasechangelog. La migración 10 fue autorizada para prepararse con respaldos; no se ejecutó sobre la base de datos desde esta tarea.

Antes de convertir datos, crea insights_bricks_before_time_model con una copia completa de los bricks. Al finalizar conserva el catálogo anterior en brick_categories_previous. No elimina tablas de respaldo. El catálogo activo queda con id y name, fusionando nombres repetidos de proyectos diferentes. La columna category se amplía a 80 caracteres para conservar los nombres admitidos anteriormente.

Convierte los UID de categorías a nombres y la descripción original a markdownSource. Las duraciones antiguas pasan a un tramo manual sin reportar, usando la fecha de alta como final y derivando el inicio de su duración; no existe evidencia de un cronometraje histórico real. Retira solo las copias anteriores de categoría, descripción y tiempo agregado en attributes, conservando otras unidades de medición. Los tiempos ausentes siguen ausentes.
