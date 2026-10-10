-- v11: network maintenance linkage + report templates
ALTER TABLE `maintenanceRecords` MODIFY COLUMN `assetId` int NULL;
SET @add_network_col = (SELECT IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='maintenanceRecords' AND COLUMN_NAME='networkDeviceId'),'SELECT 1','ALTER TABLE `maintenanceRecords` ADD COLUMN `networkDeviceId` int NULL AFTER `ticketId`'));
PREPARE stmt1 FROM @add_network_col; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;
SET @add_network_idx = (SELECT IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='maintenanceRecords' AND INDEX_NAME='maintenance_network_idx'),'SELECT 1','CREATE INDEX `maintenance_network_idx` ON `maintenanceRecords` (`networkDeviceId`)'));
PREPARE stmt2 FROM @add_network_idx; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;
CREATE TABLE IF NOT EXISTS `reportTemplates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(240) NOT NULL,
  `departmentId` int NULL,
  `locationId` int NULL,
  `fileName` varchar(255) NOT NULL,
  `mimeType` varchar(160) NOT NULL,
  `storagePath` text NOT NULL,
  `note` text NULL,
  `active` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `report_templates_department_idx` (`departmentId`),
  KEY `report_templates_location_idx` (`locationId`),
  KEY `report_templates_active_idx` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
