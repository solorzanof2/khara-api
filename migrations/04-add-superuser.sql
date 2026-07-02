--changeset fsolorzano:ADD-SUPERUSER-20250628
INSERT INTO
  `users`
  (`uid`, `status`, `createdAt`, `updatedAt`, `password`, `email`, `username`, `attributes`)
VALUES(
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000,
  '$2a$08$hX5LhnknKIqinTabeDTWXu9Fymkxg8yC2Q7dx8gspZdh60gLeEVr6',
  'sudosu@gmail.com',
  'sudosu',
  '{}'
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
    WHERE `t1`.username = 'sudosu'),
  'Super',
  'Usuario',
  '{"document": "20112223332"}',
  'natural',
  '{}'
);

INSERT INTO
  `users_roles`
  (`userId`, `roleId`)
VALUES(
  (SELECT
    `t1`.id
    FROM `users` `t1`
    WHERE `t1`.username = 'sudosu'),
  (SELECT
    `t2`.id
    FROM `roles` `t2`
    WHERE `t2`.code = 'SUDOSU')
);