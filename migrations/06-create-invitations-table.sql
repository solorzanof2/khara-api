--changeset fsolorzano:CREATE-INVITATIONS-TABLE-20260425
CREATE TABLE `invitations` (
	`id` BIGINT(20) NOT NULL AUTO_INCREMENT,
	`uid` VARCHAR(50) NOT NULL DEFAULT '0' COLLATE 'latin1_swedish_ci',
	`workspaceId` BIGINT(20) NOT NULL DEFAULT '0',
	`email` VARCHAR(512) NOT NULL DEFAULT '0' COLLATE 'latin1_swedish_ci',
	`roleId` BIGINT(20) NOT NULL DEFAULT '0',
	`token` VARCHAR(512) NOT NULL DEFAULT '0' COLLATE 'latin1_swedish_ci',
	`status` VARCHAR(20) NOT NULL DEFAULT '0' COMMENT 'pending, accepted, expired' COLLATE 'latin1_swedish_ci',
	`expiresAt` BIGINT(20) NOT NULL DEFAULT '0',
	`createdAt` BIGINT(20) NOT NULL DEFAULT '0',
	`updatedAt` BIGINT(20) NOT NULL DEFAULT '0',
	`createdBy` BIGINT(20) NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uid` (`uid`) USING BTREE,
	UNIQUE INDEX `token` (`token`) USING BTREE,
	INDEX `workspaceId` (`workspaceId`) USING BTREE,
	INDEX `email` (`email`) USING BTREE
)
COLLATE='latin1_swedish_ci'
ENGINE=MyISAM
;