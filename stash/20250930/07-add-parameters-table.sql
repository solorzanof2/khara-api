--changeset fsolorzano:ADD-PARAMETERS-TABLE-20250909
CREATE TABLE `parameters` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(127) UNIQUE NOT NULL,
  `name` varchar(255) UNIQUE NOT NULL,
  `status` varchar(15) UNIQUE NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL
);