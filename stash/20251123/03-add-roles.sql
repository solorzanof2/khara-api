--changeset fsolorzano:ADD-ROLES-20250629
INSERT INTO
  `roles`
  (`name`, `code`, `uid`, `status`, `createdAt`, `updatedAt`)
VALUES
  ('Super Usuario','SUDOSU',UUID(),'active',UNIX_TIMESTAMP() * 1000,UNIX_TIMESTAMP() * 1000),
  ('Administrador','ADMIN',UUID(),'active',UNIX_TIMESTAMP() * 1000,UNIX_TIMESTAMP() * 1000),
  ('Usuario','USER',UUID(),'active',UNIX_TIMESTAMP() * 1000,UNIX_TIMESTAMP() * 1000);

INSERT INTO
  `policies`
  (`name`, `code`, `uid`, `status`, `createdAt`, `updatedAt`, `roleId`, `effect`)
VALUES(
  'Super User Policy',
  'SUPERUSER_POLICY',
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000,
  1,
  'allow'
);

INSERT INTO
  `policies`
  (`name`, `code`, `uid`, `status`, `createdAt`, `updatedAt`, `roleId`, `effect`)
VALUES(
  'Users Policy',
  'USERS_POLICY',
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000,
  3,
  'allow'
);

INSERT INTO
  `actions`
  (`name`, `method`, `policyId`, `uid`, `status`, `createdAt`, `updatedAt`)
VALUES(
  '*',
  '*',
  1,
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000
);

INSERT INTO
  `actions`
  (`name`, `method`, `policyId`, `uid`, `status`, `createdAt`, `updatedAt`)
VALUES(
  '*',
  'GET',
  2,
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000
);

INSERT INTO
  `actions`
  (`name`, `method`, `policyId`, `uid`, `status`, `createdAt`, `updatedAt`)
VALUES(
  '*',
  'POST',
  2,
  UUID(),
  'active',
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000
);

