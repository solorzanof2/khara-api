--changeset fsolorzano:INDEXATION-20250622
ALTER TABLE `posts`
  ADD INDEX `idx_posts_uid` (`uid`),
  ADD INDEX `idx_posts_status` (`status`),
  ADD INDEX `idx_posts_created` (`createdAt`),
  ADD INDEX `idx_posts_user` (`userId`),
  ADD INDEX `idx_posts_author` (`authorId`),
  ADD INDEX `idx_posts_workspace` (`workspaceId`),
  ADD INDEX `idx_posts_project` (`projectId`),
  ADD INDEX `idx_posts_parent` (`parentId`);

ALTER TABLE `post_capabilities`
  ADD INDEX `idx_capability_id` (`uid`),
  ADD INDEX `idx_capability_status` (`status`),
  ADD INDEX `idx_capability_created` (`createdAt`),
  ADD INDEX `idx_capability_parent` (`parentId`),
  ADD INDEX `idx_capability_user` (`userId`);

ALTER TABLE `capability_records`
  ADD INDEX `idx_capabilityrecord_uid` (`uid`),
  ADD INDEX `idx_capabilityrecord_created` (`createdAt`),
  ADD INDEX `idx_capabilityrecord_parent` (`parentId`),
  ADD INDEX `idx_capabilityrecord_user` (`userId`);

ALTER TABLE `mentions`
  ADD INDEX `idx_mentions_user` (`userId`),
  ADD INDEX `idx_mentions_created` (`createdAt`),
  ADD INDEX `idx_mentions_parent` (`parentId`),
  ADD INDEX `idx_mentions_mention` (`globalMentionId`);

ALTER TABLE `global_mentions`
  ADD INDEX `idx_mentions_uid` (`uid`),
  ADD INDEX `idx_mentions_status` (`status`),
  ADD INDEX `idx_mentions_created` (`createdAt`),
  ADD INDEX `idx_mentions_parent` (`parentId`),
  ADD INDEX `idx_mentions_mention` (`mention`);

ALTER TABLE `tags`
  ADD INDEX `idx_tags_name` (`name`),
  ADD INDEX `idx_tags_usage` (`usageCount`),
  ADD INDEX `idx_tags_user` (`userId`);

ALTER TABLE `taggables`
  ADD INDEX `idx_taggables_uid` (`uid`),
  ADD INDEX `idx_taggables_created` (`createdAt`),
  ADD INDEX `idx_taggables_parent` (`parentId`),
  ADD INDEX `idx_taggables_tag` (`tagId`),
  ADD INDEX `idx_taggables_user` (`userId`);

ALTER TABLE `persons`
  ADD INDEX `idx_persons_uid` (`uid`),
  ADD INDEX `idx_persons_status` (`status`),
  ADD INDEX `idx_persons_created` (`createdAt`),
  ADD INDEX `idx_persons_userId` (`userId`),
  ADD INDEX `idx_persons_name` (`name`, `lastname`),
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

ALTER TABLE `workspaces`
  ADD INDEX `idx_workspaces_person` (`personId`),
  ADD INDEX `idx_workspaces_uid` (`uid`),
  ADD INDEX `idx_workspaces_status` (`status`),
  ADD INDEX `idx_workspaces_created` (`createdAt`);

ALTER TABLE `workspace_members`
  ADD INDEX `idx_workspace_members_workspace` (`workspaceId`, `personId`),
  ADD INDEX `idx_workspace_members_uid` (`uid`),
  ADD INDEX `idx_workspace_members_status` (`status`),
  ADD INDEX `idx_workspace_members_created` (`createdAt`);

ALTER TABLE `companies`
  ADD INDEX `idx_companies_workspace` (`workspaceId`, `personId`),
  ADD INDEX `idx_companies_uid` (`uid`),
  ADD INDEX `idx_companies_status` (`status`),
  ADD INDEX `idx_companies_created` (`createdAt`);

ALTER TABLE `teams`
  ADD INDEX `idx_teams_companyId` (`companyId`, `workspaceId`),
  ADD INDEX `idx_teams_uid` (`uid`),
  ADD INDEX `idx_teams_status` (`status`),
  ADD INDEX `idx_teams_created` (`createdAt`);

ALTER TABLE `team_members`
  ADD INDEX `idx_team_members_person` (`teamId`, `personId`),
  ADD INDEX `idx_team_members_uid` (`uid`),
  ADD INDEX `idx_team_members_status` (`status`),
  ADD INDEX `idx_team_members_created` (`createdAt`);

ALTER TABLE `org_members`
  ADD INDEX `idx_org_members_org` (`orgId`, `memberId`),
  ADD INDEX `idx_org_members_uid` (`uid`),
  ADD INDEX `idx_org_members_status` (`status`),
  ADD INDEX `idx_org_members_created` (`createdAt`);

ALTER TABLE `commercial_relationships`
  ADD INDEX `idx_commercial_relationships_person` (`aPersonId`, `bPersonId`),
  ADD INDEX `idx_commercial_relationships_uid` (`uid`),
  ADD INDEX `idx_commercial_relationships_status` (`status`),
  ADD INDEX `idx_commercial_relationships_created` (`createdAt`);

ALTER TABLE `projects`
  ADD INDEX `idx_projects_workspace` (`workspaceId`, `companyId`),
  ADD INDEX `idx_projects_uid` (`uid`),
  ADD INDEX `idx_projects_status` (`status`),
  ADD INDEX `idx_projects_created` (`createdAt`);

ALTER TABLE `project_members`
  ADD INDEX `idx_project_members_person` (`personId`, `projectId`),
  ADD INDEX `idx_project_members_uid` (`uid`),
  ADD INDEX `idx_project_members_status` (`status`),
  ADD INDEX `idx_project_members_created` (`createdAt`);

