--changeset fsolorzano:ADD-POST-TIMER--TABLE-20250909
CREATE TABLE `posts_log` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) UNIQUE NOT NULL,
  `postId` bigint(20) NOT NULL,
  `startTime` bigint(20) NOT NULL,
  `endTime` bigint(20) NOT NULL,
  `resultTime` bigint(20) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL
);