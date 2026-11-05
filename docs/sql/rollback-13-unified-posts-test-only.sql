-- SOLO para base aislada de prueba con migracion 13 completa.
-- No cargar en migrations ni ejecutar sobre produccion.
-- Aborta con datos unificados. DDL MySQL no es transaccional.
DELIMITER $$
CREATE PROCEDURE khara_rollback_unified_posts_step2()
BEGIN
  IF EXISTS (SELECT 1 FROM post_classifications)
    OR EXISTS (SELECT 1 FROM post_capabilities)
    OR EXISTS (SELECT 1 FROM post_capability_history)
    OR EXISTS (SELECT 1 FROM post_brick_details)
    OR EXISTS (SELECT 1 FROM post_time_entries)
    OR EXISTS (SELECT 1 FROM post_time_snapshots)
    OR EXISTS (SELECT 1 FROM post_source_mappings)
    OR EXISTS (SELECT 1 FROM taggables WHERE postId IS NOT NULL)
    OR EXISTS (SELECT 1 FROM mentions WHERE postId IS NOT NULL)
    OR EXISTS (SELECT 1 FROM posts WHERE parentId IS NOT NULL OR visibilityMode <> 'explicit') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rollback bloqueado: hay datos unificados; exportar y planificar restauracion sin perdida';
  END IF;

  ALTER TABLE mentions DROP FOREIGN KEY fk_mentions_unified_post,
    DROP INDEX idx_mentions_post_mention, DROP COLUMN postId;
  ALTER TABLE taggables DROP FOREIGN KEY fk_taggables_unified_post,
    DROP INDEX idx_taggables_post_tag, DROP COLUMN postId;
  DROP TABLE post_source_mappings;
  DROP TABLE post_time_snapshots;
  DROP TABLE post_time_entries;
  DROP TABLE post_brick_details;
  DROP TABLE post_capability_history;
  DROP TABLE post_capabilities;
  DROP TABLE post_classifications;
  ALTER TABLE posts DROP FOREIGN KEY fk_posts_parent,
    DROP INDEX idx_posts_parent_status, DROP INDEX idx_posts_project_roots,
    DROP INDEX idx_posts_user_roots, DROP COLUMN parentId, DROP COLUMN visibilityMode;
  DELETE FROM databasechangelog WHERE author = 'codex' AND title IN (
    'UNIFIED-POSTS-BASE-20261102',
    'UNIFIED-POSTS-CLASSIFICATIONS-20261102',
    'UNIFIED-POSTS-CAPABILITIES-20261102',
    'UNIFIED-POSTS-CAPABILITY-HISTORY-20261102',
    'UNIFIED-POSTS-BRICK-DETAILS-20261102',
    'UNIFIED-POSTS-TIME-ENTRIES-20261102',
    'UNIFIED-POSTS-TIME-SNAPSHOTS-20261102',
    'UNIFIED-POSTS-SOURCE-MAPPINGS-20261102',
    'UNIFIED-POSTS-TAGGABLES-20261102',
    'UNIFIED-POSTS-MENTIONS-20261102'
  );
END$$
DELIMITER ;
CALL khara_rollback_unified_posts_step2();
DROP PROCEDURE khara_rollback_unified_posts_step2;
