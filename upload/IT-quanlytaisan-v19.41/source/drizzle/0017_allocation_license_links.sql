-- v19.14: software license attachments for allocation / return workflows.
CREATE TABLE IF NOT EXISTS `allocationLicenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `allocationId` int NOT NULL,
  `licenseId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `allocation_licenses_allocation_idx` (`allocationId`),
  KEY `allocation_licenses_license_idx` (`licenseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
