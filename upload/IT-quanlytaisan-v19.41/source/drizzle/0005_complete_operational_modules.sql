CREATE TABLE IF NOT EXISTS `handoverDocuments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fileName` varchar(255) NOT NULL,
  `type` varchar(80) NOT NULL,
  `size` int NOT NULL DEFAULT 0,
  `storagePath` text,
  `documentUrl` text,
  `note` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `systemUsers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(80) NOT NULL,
  `fullName` varchar(180) NOT NULL,
  `passwordHash` text NOT NULL,
  `role` enum('administrator','manager','operator','viewer') NOT NULL DEFAULT 'operator',
  `active` int NOT NULL DEFAULT 1,
  `mustChangePassword` int NOT NULL DEFAULT 1,
  `lastLoginAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `systemUsers_username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inventoryChecks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `checkCode` varchar(80) NOT NULL,
  `departmentId` int DEFAULT NULL,
  `locationId` int DEFAULT NULL,
  `checkedById` int DEFAULT NULL,
  `status` enum('draft','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  `note` text,
  `startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `inventoryChecks_code_unique` (`checkCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inventoryCheckItems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inventoryCheckId` int NOT NULL,
  `assetId` int NOT NULL,
  `expectedStatus` varchar(40),
  `actualStatus` varchar(40),
  `found` int NOT NULL DEFAULT 0,
  `note` text,
  PRIMARY KEY (`id`), KEY `inventoryCheckItems_check_idx` (`inventoryCheckId`), KEY `inventoryCheckItems_asset_idx` (`assetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `licenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `licenseCode` varchar(80) NOT NULL,
  `productName` varchar(240) NOT NULL,
  `vendor` varchar(180),
  `licenseType` varchar(100),
  `quantity` int NOT NULL DEFAULT 1,
  `usedQuantity` int NOT NULL DEFAULT 0,
  `expiryDate` timestamp NULL DEFAULT NULL,
  `status` enum('active','expiring','expired','cancelled') NOT NULL DEFAULT 'active',
  `note` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `licenses_code_unique` (`licenseCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `networkDevices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deviceCode` varchar(80) NOT NULL,
  `name` varchar(240) NOT NULL,
  `deviceType` varchar(100),
  `ipAddress` varchar(64),
  `macAddress` varchar(64),
  `locationId` int DEFAULT NULL,
  `status` enum('active','maintenance','offline','retired') NOT NULL DEFAULT 'active',
  `note` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `networkDevices_code_unique` (`deviceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
