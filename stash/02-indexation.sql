--changeset fsolorzano:INDEXATION-20250622
ALTER TABLE `posts`
  ADD INDEX `idx_posts_uid` (`uid`),
  ADD INDEX `idx_posts_status` (`status`),
  ADD INDEX `idx_posts_created` (`created`);

-- ALTER TABLE `categories`
--   ADD INDEX `idx_categories_uid` (`uid`),
--   ADD INDEX `idx_categories_code` (`code`),
--   ADD INDEX `idx_categories_status` (`status`),
--   ADD INDEX `idx_categories_created` (`created`);

-- ALTER TABLE `files`
--   ADD INDEX `idx_files_uid` (`uid`),
--   ADD INDEX `idx_files_status` (`status`),
--   ADD INDEX `idx_files_created` (`created`),
--   ADD INDEX `idx_files_auctioneerId` (`auctioneerId`),
--   ADD INDEX `idx_files_fileNumber` (`fileNumber`),
--   ADD INDEX `idx_files_time_range` (`startTime`, `endTime`);

ALTER TABLE `tags
  ADD INDEX `idx_tags_name` (`name`);

ALTER TABLE `posts_hashtags`
  ADD INDEX `idx_posthashtags_postId` (`postId`),
  ADD INDEX `idx_posthashtags_tagId` (`tagId`);

ALTER TABLE `posts_mentions`
  ADD INDEX `idx_posthashtags_postId` (`postId`),
  ADD INDEX `idx_posthashtags_tagId` (`tagId`);

-- ALTER TABLE `attachments`
--   ADD INDEX `idx_attachments_uid` (`uid`),
--   ADD INDEX `idx_attachments_status` (`status`),
--   ADD INDEX `idx_attachments_created` (`created`);

-- ALTER TABLE `offers`
--   ADD INDEX `idx_offers_uid` (`uid`),
--   ADD INDEX `idx_offers_status` (`status`),
--   ADD INDEX `idx_offers_created` (`created`),
--   ADD INDEX `idx_offers_userId` (`userId`),
--   ADD INDEX `idx_offers_postId` (`postId`),
--   ADD INDEX `idx_offers_amount` (`amount`),
--   ADD INDEX `idx_offers_user_post` (`userId`, `postId`);

-- ALTER TABLE `compliances`
--   ADD INDEX `idx_compliances_uid` (`uid`),
--   ADD INDEX `idx_compliances_status` (`status`),
--   ADD INDEX `idx_compliances_created` (`created`),
--   ADD INDEX `idx_compliances_fileId` (`fileId`);

-- ALTER TABLE `parameters`
--   ADD INDEX `idx_parameters_uid` (`uid`),
--   ADD INDEX `idx_parameters_status` (`status`),
--   ADD INDEX `idx_parameters_created` (`created`);

-- ALTER TABLE `payments`
--   ADD INDEX `idx_payments_uid` (`uid`),
--   ADD INDEX `idx_payments_status` (`status`),
--   ADD INDEX `idx_payments_created` (`created`),
--   ADD INDEX `idx_payments_userId` (`userId`);

-- ALTER TABLE `users_favorites`
--   ADD INDEX `idx_users_favorites_uid` (`uid`),
--   ADD INDEX `idx_users_favorites_status` (`status`),
--   ADD INDEX `idx_users_favorites_created` (`created`),
--   ADD INDEX `idx_users_favorites_userId` (`userId`),
--   ADD INDEX `idx_users_favorites_postId` (`postId`),
--   ADD UNIQUE INDEX `idx_users_favorites_user_post` (`userId`, `postId`);

-- ALTER TABLE `faqs`
--   ADD INDEX `idx_faqs_uid` (`uid`),
--   ADD INDEX `idx_faqs_status` (`status`),
--   ADD INDEX `idx_faqs_created` (`created`),
--   ADD INDEX `idx_faqs_userId` (`userId`),
--   ADD INDEX `idx_faqs_postId` (`postId`),
--   ADD INDEX `idx_faqs_auctioneerId` (`auctioneerId`);

ALTER TABLE `persons`
  ADD INDEX `idx_persons_uid` (`uid`),
  ADD INDEX `idx_persons_status` (`status`),
  ADD INDEX `idx_persons_created` (`created`),
  ADD INDEX `idx_persons_userId` (`userId`),
  ADD INDEX `idx_persons_document` (`document`),
  ADD INDEX `idx_persons_name` (`name`, `lastname`),
  ADD INDEX `idx_persons_location` (`province`, `locality`),
  ADD INDEX `idx_persons_type` (`personType`);

-- ALTER TABLE `localities`
--   ADD INDEX `idx_localities_provinceId` (`provinceId`);

-- ALTER TABLE `offers_warranty`
--   ADD INDEX `idx_offers_uid` (`uid`),
--   ADD INDEX `idx_offers_warranty_status` (`status`),
--   ADD INDEX `idx_offers_warranty_created` (`created`),
--   ADD INDEX `idx_offers_warranty_expired` (`expired`);

ALTER TABLE `roles`
  ADD INDEX `idx_roles_uid` (`uid`),
  ADD INDEX `idx_roles_code` (`code`),
  ADD INDEX `idx_roles_status` (`status`),
  ADD INDEX `idx_roles_created` (`created`);

ALTER TABLE `policies`
  ADD INDEX `idx_policies_uid` (`uid`),
  ADD INDEX `idx_policies_code` (`code`),
  ADD INDEX `idx_policies_status` (`status`),
  ADD INDEX `idx_policies_created` (`created`),
  ADD INDEX `idx_policies_roleId` (`roleId`),
  ADD INDEX `idx_policies_effect` (`effect`);

ALTER TABLE `actions`
  ADD INDEX `idx_actions_uid` (`uid`),
  ADD INDEX `idx_actions_method` (`method`),
  ADD INDEX `idx_actions_policyId` (`policyId`),
  ADD INDEX `idx_actions_status` (`status`),
  ADD INDEX `idx_actions_created` (`created`);

ALTER TABLE `users`
  ADD INDEX `idx_users_uid` (`uid`),
  ADD INDEX `idx_users_status` (`status`),
  ADD INDEX `idx_users_created` (`created`),
  ADD INDEX `idx_users_username` (`username`),
  ADD INDEX `idx_users_email` (`email`);

ALTER TABLE `users_roles`
  ADD UNIQUE INDEX `idx_users_roles_user_role` (`userId`, `roleId`);

ALTER TABLE `menus`
  ADD INDEX `idx_menus_uid` (`uid`),
  ADD INDEX `idx_menus_status` (`status`),
  ADD INDEX `idx_menus_created` (`created`),
  ADD INDEX `idx_menus_order` (`order`);

ALTER TABLE `roles_menus`
  ADD UNIQUE INDEX `idx_roles_menus_role_menu` (`roleId`, `menuId`);

-- ALTER TABLE `actions_policies`
--   ADD UNIQUE INDEX `idx_roles_menus_role_menu` (`policyId`, `actionId`);

