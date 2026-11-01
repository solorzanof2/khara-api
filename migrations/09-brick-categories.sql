--changeset fsolorzano:CREATE-BRICK-CATEGORIES-TABLE-20261101
CREATE TABLE brick_categories (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(50) NOT NULL,
  workspaceId BIGINT NOT NULL,
  projectId BIGINT NOT NULL,
  name VARCHAR(80) NOT NULL,
  normalizedName VARCHAR(127) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  hashtag VARCHAR(127) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  createdAt BIGINT NOT NULL,
  userId BIGINT NOT NULL,
  UNIQUE KEY brick_categories_uid (uid),
  UNIQUE KEY brick_categories_project_name (projectId, normalizedName),
  UNIQUE KEY brick_categories_project_hashtag (projectId, hashtag),
  KEY brick_categories_workspace_project (workspaceId, projectId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO brick_categories (uid, workspaceId, projectId, name, normalizedName, hashtag, createdAt, userId)
SELECT UUID(), p.workspaceId, p.id, seed.name, seed.normalizedName, seed.hashtag,
  FLOOR(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000), 0
FROM projects p CROSS JOIN (
  SELECT 'General' AS name, 'general' AS normalizedName, 'general' AS hashtag
  UNION ALL SELECT 'Desarrollo', 'desarrollo', 'desarrollo'
  UNION ALL SELECT 'Testing', 'testing', 'testing'
  UNION ALL SELECT 'Análisis', 'analisis', 'analisis'
) seed WHERE p.status <> 'deleted';
