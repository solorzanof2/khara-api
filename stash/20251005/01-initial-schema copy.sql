--changeset fsolorzano:SCHEMA-20250803
CREATE TABLE `posts` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'deleted',
  `htmlSource` longtext NOT NULL,
  `markdownSource` longtext NOT NULL,
  `hashtags` varchar(512),
  `mentions` varchar(512),
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `attributes` json NOT NULL
);

CREATE TABLE `posts_comments` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `markdownSource` longtext NOT NULL,
  `htmlSource` longtext NOT NULL,
  `hashtags` varchar(512),
  `mentions` varchar(512),
  `parentId` bigint(20)
);

CREATE TABLE `posts_insights` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | done | reported | none',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `markdownSource` longtext NOT NULL,
  `htmlSource` longtext NOT NULL,
  `hashtags` varchar(512),
  `mentions` varchar(512),
  `parentId` bigint(20)
);

CREATE TABLE `insights_comments` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `markdownSource` longtext NOT NULL,
  `htmlSource` longtext NOT NULL,
  `hashtags` varchar(512),
  `mentions` varchar(512),
  `parentId` bigint(20)
);

CREATE TABLE `insights_bricks` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `parentId` bigint(20),
  `category` varchar(63) NOT NULL,
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `attributes` json NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | done | reported | none'
);

CREATE TABLE `tags` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(100) UNIQUE NOT NULL,
  `category` varchar(20) NOT NULL DEFAULT 'mention' COMMENT 'mention | hashtag',
  `link` varchar(512) NOT NULL,
  `usageCount` bigint(20) NOT NULL DEFAULT '1',
);

CREATE TABLE `taggables` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `tagId` bigint,
  `parentType` varchar(127) NOT NULL DEFAULT 'post' COMMENT 'post, post_comment, insight, insight_comment, insight_brick',
  `parentId` bigint(20) NOT NULL,
  `userId` bigint(20)
);

CREATE TABLE `users` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'pending' COMMENT 'pending | active | inactive',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `password` varchar(256) NOT NULL,
  `email` varchar(256) NOT NULL,
  `username` varchar(128) UNIQUE NOT NULL,
  `attributes` json NOT NULL
);

CREATE TABLE `persons` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `status` varchar(15) NOT NULL DEFAULT 'active',
  `uid` varchar(127) UNIQUE NOT NULL,
  `userId` bigint(20),
  `name` varchar(63) NOT NULL,
  `lastname` varchar(63),
  `document` varchar(11) NOT NULL,
  `attributes` json NOT NULL,
  `personType` varchar(8) NOT NULL DEFAULT 'natural' COMMENT 'natural | legal | application',
  `province` varchar(63) NOT NULL,
  `locality` varchar(63) NOT NULL,
  `attachments` json NOT NULL
);

CREATE TABLE `roles` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(511) UNIQUE NOT NULL,
  `code` varchar(127) UNIQUE NOT NULL,
  `uid` varchar(127) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `policies` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(127) UNIQUE NOT NULL,
  `code` varchar(127) UNIQUE NOT NULL,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `roleId` bigint(20) NOT NULL,
  `effect` varchar(8) NOT NULL DEFAULT 'allow' COMMENT 'allow | deny'
);

CREATE TABLE `actions` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `method` varchar(127) UNIQUE NOT NULL DEFAULT 'get',
  `policyId` bigint(20) NOT NULL,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `users_roles` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `userId` bigint(20) NOT NULL,
  `roleId` bigint(20) NOT NULL
);

CREATE TABLE `menus` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `label` varchar(63) NOT NULL,
  `path` varchar(255) NOT NULL,
  `icon` varchar(63) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `code` varchar(23) NOT NULL,
  `order` tinyint NOT NULL
);

CREATE TABLE `roles_menus` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `roleId` bigint(20),
  `menuId` bigint(20)
);

CREATE TABLE `parameters` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL,
  `attributes` json NOT NULL,
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `status` varchar(15) NOT NULL DEFAULT 'active',
  `uid` varchar(127) UNIQUE NOT NULL
);

ALTER TABLE `posts` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `posts_comments` ADD FOREIGN KEY (`parentId`) REFERENCES `posts` (`id`);

ALTER TABLE `posts_insights` ADD FOREIGN KEY (`parentId`) REFERENCES `posts` (`id`);

ALTER TABLE `insights_comments` ADD FOREIGN KEY (`parentId`) REFERENCES `posts_insights` (`id`);

ALTER TABLE `insights_bricks` ADD FOREIGN KEY (`parentId`) REFERENCES `posts_insights` (`id`);

ALTER TABLE `taggables` ADD FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`);

ALTER TABLE `taggables` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `persons` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `policies` ADD FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`);

ALTER TABLE `actions` ADD FOREIGN KEY (`policyId`) REFERENCES `policies` (`id`);

ALTER TABLE `users_roles` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `users_roles` ADD FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`);

ALTER TABLE `roles_menus` ADD FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`);

ALTER TABLE `roles_menus` ADD FOREIGN KEY (`menuId`) REFERENCES `menus` (`id`);






