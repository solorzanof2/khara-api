--changeset fsolorzano:ADD-LINK-COLUMN--TAGS-TABLE-20250927
ALTER TABLE `tags` ADD COLUMN `link` varchar(512) after `category`;