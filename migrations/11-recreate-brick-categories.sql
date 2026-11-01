--changeset fsolorzano:RECREATE-BRICK-CATEGORIES-20261101
DROP TABLE brick_categories;

CREATE TABLE brick_categories (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  UNIQUE KEY brick_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO brick_categories (name) VALUES ('General'), ('Desarrollo'), ('Testing'), ('Análisis');

ALTER TABLE insights_bricks MODIFY COLUMN category VARCHAR(128) NOT NULL DEFAULT 'General';
