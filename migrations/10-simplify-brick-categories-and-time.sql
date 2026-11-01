--changeset fsolorzano:SIMPLIFY-BRICK-CATEGORIES-AND-TIME-20261101
CREATE TABLE insights_bricks_before_time_model LIKE insights_bricks;

INSERT INTO insights_bricks_before_time_model SELECT * FROM insights_bricks;

CREATE TABLE brick_categories_next (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  UNIQUE KEY brick_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO brick_categories_next (name) VALUES ('General'), ('Desarrollo'), ('Testing'), ('Análisis');

INSERT INTO brick_categories_next (name)
SELECT name FROM brick_categories ORDER BY id
ON DUPLICATE KEY UPDATE name = brick_categories_next.name;

ALTER TABLE insights_bricks MODIFY COLUMN category VARCHAR(80) NOT NULL DEFAULT 'General';

UPDATE insights_bricks b INNER JOIN brick_categories c ON b.category = c.uid SET b.category = c.name;

UPDATE insights_bricks SET category = JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.category.name'))
WHERE JSON_TYPE(JSON_EXTRACT(attributes, '$.category.name')) = 'STRING';

UPDATE insights_bricks SET markdownSource = JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.description'))
WHERE JSON_TYPE(JSON_EXTRACT(attributes, '$.description')) = 'STRING';

UPDATE insights_bricks
SET attributes = JSON_SET(attributes, '$.time', JSON_OBJECT(
  'measurements', JSON_ARRAY(JSON_OBJECT(
    'startedAt', GREATEST(0, createdAt - CAST(JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.measurements.time.millis')) AS SIGNED)),
    'finishedAt', createdAt,
    'label', REPLACE(JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.measurements.time.label')), ' ', ''),
    'millis', CAST(JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.measurements.time.millis')) AS UNSIGNED),
    'createdAt', createdAt, 'reported', JSON_EXTRACT('false', '$')
  )),
  'totals', JSON_OBJECT(
    'label', REPLACE(JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.measurements.time.label')), ' ', ''),
    'millis', CAST(JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.measurements.time.millis')) AS UNSIGNED),
    'createdAt', createdAt, 'updatedAt', updatedAt, 'reported', '0s'
  )
))
WHERE JSON_EXTRACT(attributes, '$.time') IS NULL
  AND JSON_TYPE(JSON_EXTRACT(attributes, '$.measurements.time.millis')) IN ('INTEGER', 'DOUBLE')
  AND CAST(JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.measurements.time.millis')) AS UNSIGNED) > 0;

UPDATE insights_bricks SET attributes = JSON_REMOVE(attributes, '$.description', '$.category', '$.measurements.time');

UPDATE insights_bricks SET attributes = JSON_REMOVE(attributes, '$.measurements')
WHERE JSON_LENGTH(JSON_EXTRACT(attributes, '$.measurements')) = 0;

RENAME TABLE brick_categories TO brick_categories_previous, brick_categories_next TO brick_categories;
