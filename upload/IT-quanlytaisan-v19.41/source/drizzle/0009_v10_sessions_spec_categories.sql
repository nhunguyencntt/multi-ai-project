-- v10: multi-category specification fields + user sessions/activity
CREATE TABLE IF NOT EXISTS `assetSpecificationFieldCategories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fieldId` int NOT NULL,
  `categoryId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asfc_field_idx` (`fieldId`),
  KEY `asfc_category_idx` (`categoryId`),
  UNIQUE KEY `asfc_unique_field_category` (`fieldId`,`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO assetSpecificationFieldCategories (fieldId, categoryId)
SELECT id, categoryId FROM assetSpecificationFields
WHERE categoryId IS NOT NULL;

CREATE TABLE IF NOT EXISTS `systemUserSessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `sessionTokenHash` varchar(128) NOT NULL,
  `ipAddress` varchar(64),
  `userAgent` varchar(512),
  `loginAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastSeenAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logoutAt` timestamp NULL,
  `active` int NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sus_token_unique` (`sessionTokenHash`),
  KEY `sus_user_idx` (`userId`),
  KEY `sus_last_seen_idx` (`lastSeenAt`),
  KEY `sus_active_idx` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `systemActivityLogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NULL,
  `sessionId` int NULL,
  `method` varchar(16),
  `path` varchar(512) NOT NULL,
  `page` varchar(160),
  `ipAddress` varchar(64),
  `userAgent` varchar(512),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sal_user_idx` (`userId`),
  KEY `sal_created_idx` (`createdAt`),
  KEY `sal_path_idx` (`path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
