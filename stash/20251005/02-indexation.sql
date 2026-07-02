--changeset fsolorzano:INDEXATION-20250622
ALTER TABLE `posts`
  ADD INDEX `idx_posts_uid` (`uid`),
  ADD INDEX `idx_posts_status` (`status`),
  ADD INDEX `idx_posts_created` (`createdAt`);

ALTER TABLE `tags`
  ADD INDEX `idx_tags_name` (`name`);

ALTER TABLE `posts_hashtags`
  ADD INDEX `idx_posthashtags_postId` (`postId`),
  ADD INDEX `idx_posthashtags_tagId` (`tagId`);

ALTER TABLE `posts_mentions`
  ADD INDEX `idx_posthashtags_postId` (`postId`),
  ADD INDEX `idx_posthashtags_tagId` (`tagId`);

ALTER TABLE `persons`
  ADD INDEX `idx_persons_uid` (`uid`),
  ADD INDEX `idx_persons_status` (`status`),
  ADD INDEX `idx_persons_created` (`createdAt`),
  ADD INDEX `idx_persons_userId` (`userId`),
  ADD INDEX `idx_persons_document` (`document`),
  ADD INDEX `idx_persons_name` (`name`, `lastname`),
  ADD INDEX `idx_persons_location` (`province`, `locality`),
  ADD INDEX `idx_persons_type` (`personType`);

ALTER TABLE `roles`
  ADD INDEX `idx_roles_uid` (`uid`),
  ADD INDEX `idx_roles_code` (`code`),
  ADD INDEX `idx_roles_status` (`status`),
  ADD INDEX `idx_roles_created` (`createdAt`);

ALTER TABLE `policies`
  ADD INDEX `idx_policies_uid` (`uid`),
  ADD INDEX `idx_policies_code` (`code`),
  ADD INDEX `idx_policies_status` (`status`),
  ADD INDEX `idx_policies_created` (`createdAt`),
  ADD INDEX `idx_policies_roleId` (`roleId`),
  ADD INDEX `idx_policies_effect` (`effect`);

ALTER TABLE `actions`
  ADD INDEX `idx_actions_uid` (`uid`),
  ADD INDEX `idx_actions_method` (`method`),
  ADD INDEX `idx_actions_policyId` (`policyId`),
  ADD INDEX `idx_actions_status` (`status`),
  ADD INDEX `idx_actions_created` (`createdAt`);

ALTER TABLE `users`
  ADD INDEX `idx_users_uid` (`uid`),
  ADD INDEX `idx_users_status` (`status`),
  ADD INDEX `idx_users_created` (`createdAt`),
  ADD INDEX `idx_users_username` (`username`),
  ADD INDEX `idx_users_email` (`email`);

ALTER TABLE `users_roles`
  ADD UNIQUE INDEX `idx_users_roles_user_role` (`userId`, `roleId`);

ALTER TABLE `menus`
  ADD INDEX `idx_menus_uid` (`uid`),
  ADD INDEX `idx_menus_status` (`status`),
  ADD INDEX `idx_menus_created` (`createdAt`),
  ADD INDEX `idx_menus_order` (`order`);

ALTER TABLE `roles_menus`
  ADD UNIQUE INDEX `idx_roles_menus_role_menu` (`roleId`, `menuId`);

