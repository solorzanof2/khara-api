--changeset fsolorzano:SCHEMA-20261031
ALTER TABLE global_mentions
  MODIFY COLUMN mention varchar(64) NOT NULL,
  MODIFY COLUMN displayName varchar(255) NOT NULL,
  MODIFY COLUMN parentType varchar(32) NOT NULL DEFAULT 'user' COMMENT 'user | project | team | customer';
