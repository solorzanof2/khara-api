--changeset fsolorzano:ADD-FELIXOUSER-20250818
INSERT INTO
  `users`
  (`uid`, `status`, `createdAt`, `updatedAt`, `password`, `email`, `username`, `attributes`)
VALUES(
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000,
  '$2a$08$hX5LhnknKIqinTabeDTWXu9Fymkxg8yC2Q7dx8gspZdh60gLeEVr6',
  'solorzanof2@gmail.com',
  'felixo',
  '{}'
);

INSERT INTO
  `global_mentions`
  (`createdAt`, `updatedAt`, `status`, `uid`, `parentId`, `parentType`, `mention`, `displayName`)
VALUES(
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000,
  'active',
  UUID(),
  (SELECT
    `t1`.id
    FROM `users` `t1`
    WHERE `t1`.username = 'felixo'),
  'user',
  'felixo',
  'Félix Solórzano'
);

INSERT INTO
  `persons`
  (`createdAt`, `updatedAt`, `status`, `uid`, `userId`, `name`, `lastname`, `attributes`, `personType`, `attachments`)
VALUES(
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000,
  'active',
  UUID(),
  (SELECT
    `t1`.id
    FROM `users` `t1`
    WHERE `t1`.username = 'felixo'),
  'Félix',
  'Solórzano',
  '{"document": "20957791612"}',
  'natural',
  '{}'
);

INSERT INTO
  `workspaces`
  (`personId`, `name`, `uid`, `status`, `createdAt`, `updatedAt`)
VALUES(
  (SELECT
    `t1`.id
    FROM `persons` `t1`
    ORDER BY `t1`.id DESC
    LIMIT 1),
  'Félix Workspace',
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000
);

INSERT INTO
  `workspace_members`
  (`workspaceId`, `personId`, `uid`, `role`, `status`, `createdAt`, `updatedAt`)
VALUES(
  (SELECT
    `t1`.id
    FROM `workspaces` `t1`
    ORDER BY `t1`.id DESC
    LIMIT 1),
  (SELECT
    `t1`.id
    FROM `persons` `t1`
    ORDER BY `t1`.id DESC
    LIMIT 1),
  UUID(),
  'internal',
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000
);

INSERT INTO
  `companies`
  (`personId`, `workspaceId`, `companyType`, `uid`, `status`, `createdAt`, `updatedAt`)
VALUES(
  (SELECT
    `t1`.id
    FROM `persons` `t1`
    ORDER BY `t1`.id DESC
    LIMIT 1),
  (SELECT
    `t1`.id
    FROM `workspaces` `t1`
    ORDER BY `t1`.id DESC
    LIMIT 1),
  'internal',
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000
);

INSERT INTO
  `projects`
  (`uid`, `workspaceId`, `companyId`, `name`, `projectKey`, `visibility`, `status`, `createdAt`, `updatedAt`)
VALUES(
  UUID(),
  (SELECT
    `t1`.id
    FROM `workspaces` `t1`
    ORDER BY `t1`.id DESC
    LIMIT 1),
  (SELECT
    `t1`.id
    FROM `companies` `t1`
    ORDER BY `t1`.id DESC
    LIMIT 1),
  'My First Project',
  'MFP',
  'private',
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000
);

INSERT INTO
  `users_roles`
  (`userId`, `roleId`)
VALUES(
  (SELECT
    `t1`.id
    FROM `users` `t1`
    WHERE `t1`.username = 'felixo'),
  (SELECT
    `t2`.id
    FROM `roles` `t2`
    WHERE `t2`.code = 'ADMIN')
);
