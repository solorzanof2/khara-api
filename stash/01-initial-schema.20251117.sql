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
  `parentId` bigint(20),
  `userId` bigint(20) NOT NULL
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
  `parentId` bigint(20),
  `userId` bigint(20) NOT NULL,
  `votes` bigint(20) NOT NULL DEFAULT '0'
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
  `parentId` bigint(20),
  `userId` bigint(20) NOT NULL
);

CREATE TABLE `insights_bricks` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `parentId` bigint(20),
  `category` varchar(63) NOT NULL,
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `attributes` json NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | done | reported | none',
  `userId` bigint(20) NOT NULL
);

CREATE TABLE `tags` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` varchar(20) NOT NULL DEFAULT 'mention' COMMENT 'mention, hashtag',
  `link` varchar(512) NOT NULL,
  `usageCount` bigint(20) NOT NULL DEFAULT '1',
  `userId` bigint(20) NOT NULL,
  UNIQUE (`name`, `category`)
);

CREATE TABLE `taggables` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL,
  `tagId` bigint,
  `parentType` varchar(127) NOT NULL DEFAULT 'post' COMMENT 'post, post_comment, insight, insight_comment, insight_brick',
  `parentId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `attributes` json NOT NULL
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
  `userId` bigint(20) NOT NULL,
  `name` varchar(63) NOT NULL,
  `lastname` varchar(63),
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

CREATE TABLE `workspaces` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `personId` bigint(20) NOT NULL,
  `name` varchar(63) NOT NULL,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `workspace_memberships` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `workspaceId` bigint(20),
  `personId` bigint(20),
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `companies` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `personId` bigint(20),
  `workspaceId` bigint(20),
  `companyType` varchar(8) NOT NULL DEFAULT 'internal' COMMENT 'internal | external',
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `teams` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `companyId` bigint(20),
  `workspaceId` bigint(20) NOT NULL,
  `name` varchar(63) NOT NULL,
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `team_members` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `teamId` bigint(20),
  `personId` bigint(20),
  `role` varchar(8) NOT NULL DEFAULT 'member' COMMENT 'member | lead',
  `since` bigint(20) NOT NULL COMMENT 'person is team member from date',
  `until` bigint(20) NOT NULL COMMENT 'person is team member to date',
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `org_members` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `orgId` bigint(20) NOT NULL,
  `memberId` bigint(20) NOT NULL,
  `title` varchar(128),
  `department` varchar(128),
  `since` bigint(20) NOT NULL COMMENT 'person is in org from date',
  `until` bigint(20) NOT NULL COMMENT 'person is in org to date',
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `commercial_relationships` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `aPersonId` bigint(20) NOT NULL,
  `bPersonId` bigint(20) NOT NULL,
  `relationType` varchar(24) NOT NULL DEFAULT 'client' COMMENT 'client | supplier | partner',
  `since` bigint(20) NOT NULL COMMENT 'relation is from date',
  `until` bigint(20) NOT NULL COMMENT 'relation is to date',
  `uid` varchar(50) UNIQUE NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `projects` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `workspaceId` bigint(20) NOT NULL,
  `companyId` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `projectKey` varchar(64) NOT NULL,
  `visibility` varchar(12) NOT NULL DEFAULT 'internal' COMMENT 'private | internal | team | restricted | public',
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

CREATE TABLE `project_members` (
  `id` bigint(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `projectId` bigint(20) NOT NULL,
  `personId` bigint(20) NOT NULL,
  `role` varchar(12) NOT NULL DEFAULT 'viewer' COMMENT 'owner | manager | contributor | viewer',
  `status` varchar(16) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | deleted',
  `createdAt` bigint(20) NOT NULL,
  `updatedAt` bigint(20) NOT NULL
);

ALTER TABLE `posts` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `posts_comments` ADD FOREIGN KEY (`parentId`) REFERENCES `posts` (`id`);

ALTER TABLE `posts_comments` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `posts_insights` ADD FOREIGN KEY (`parentId`) REFERENCES `posts` (`id`);

ALTER TABLE `posts_insights` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `insights_comments` ADD FOREIGN KEY (`parentId`) REFERENCES `posts_insights` (`id`);

ALTER TABLE `insights_comments` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `insights_bricks` ADD FOREIGN KEY (`parentId`) REFERENCES `posts_insights` (`id`);

ALTER TABLE `insights_bricks` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `tags` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `taggables` ADD FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`);

ALTER TABLE `taggables` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `persons` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `policies` ADD FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`);

ALTER TABLE `actions` ADD FOREIGN KEY (`policyId`) REFERENCES `policies` (`id`);

ALTER TABLE `users_roles` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `users_roles` ADD FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`);

ALTER TABLE `roles_menus` ADD FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`);

ALTER TABLE `roles_menus` ADD FOREIGN KEY (`menuId`) REFERENCES `menus` (`id`);

ALTER TABLE `persons` ADD FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `workspaces` ADD FOREIGN KEY (`personId`) REFERENCES `persons` (`id`);

ALTER TABLE `workspace_memberships` ADD FOREIGN KEY (`workspaceId`) REFERENCES `workspaces` (`id`);

ALTER TABLE `workspace_memberships` ADD FOREIGN KEY (`personId`) REFERENCES `persons` (`id`);

ALTER TABLE `companies` ADD FOREIGN KEY (`personId`) REFERENCES `persons` (`id`);

ALTER TABLE `companies` ADD FOREIGN KEY (`workspaceId`) REFERENCES `workspaces` (`id`);

ALTER TABLE `teams` ADD FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`);

ALTER TABLE `teams` ADD FOREIGN KEY (`workspaceId`) REFERENCES `workspaces` (`id`);

ALTER TABLE `team_members` ADD FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`);

ALTER TABLE `team_members` ADD FOREIGN KEY (`personId`) REFERENCES `persons` (`id`);

ALTER TABLE `org_members` ADD FOREIGN KEY (`orgId`) REFERENCES `persons` (`id`);

ALTER TABLE `org_members` ADD FOREIGN KEY (`memberId`) REFERENCES `persons` (`id`);

ALTER TABLE `commercial_relationships` ADD FOREIGN KEY (`aPersonId`) REFERENCES `persons` (`id`);

ALTER TABLE `commercial_relationships` ADD FOREIGN KEY (`bPersonId`) REFERENCES `persons` (`id`);

ALTER TABLE `projects` ADD FOREIGN KEY (`workspaceId`) REFERENCES `workspaces` (`id`);

ALTER TABLE `projects` ADD FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`);

ALTER TABLE `project_members` ADD FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`);

ALTER TABLE `project_members` ADD FOREIGN KEY (`personId`) REFERENCES `persons` (`id`);





