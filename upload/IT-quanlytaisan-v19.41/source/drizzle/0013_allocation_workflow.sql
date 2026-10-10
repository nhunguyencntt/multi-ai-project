-- v16: allocation / return workflow, ticket linkage, warehouse tracking and editable handover templates.
SET @db := DATABASE();

SET @has_assets_wh := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='assets' AND COLUMN_NAME='warehouseId');
SET @sql := IF(@has_assets_wh=0, 'ALTER TABLE `assets` ADD COLUMN `warehouseId` int NULL AFTER `locationId`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := 'ALTER TABLE `assets` MODIFY COLUMN `status` enum(\'in_use\',\'available\',\'pending_allocation\',\'pending_return\',\'repair\',\'damaged\',\'retired\') NOT NULL DEFAULT \'available\'';
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @has_alloc_wh := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='assetAllocations' AND COLUMN_NAME='warehouseId');
SET @sql := IF(@has_alloc_wh=0, 'ALTER TABLE `assetAllocations` ADD COLUMN `warehouseId` int NULL AFTER `locationId`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @has_alloc_ticket := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='assetAllocations' AND COLUMN_NAME='ticketId');
SET @sql := IF(@has_alloc_ticket=0, 'ALTER TABLE `assetAllocations` ADD COLUMN `ticketId` int NULL AFTER `warehouseId`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql := 'ALTER TABLE `assetAllocations` MODIFY COLUMN `status` enum(\'pending_allocation\',\'active\',\'pending_return\',\'returned\',\'cancelled\') NOT NULL DEFAULT \'pending_allocation\'';
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @has_handover_alloc := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='handoverRecords' AND COLUMN_NAME='allocationId');
SET @sql := IF(@has_handover_alloc=0, 'ALTER TABLE `handoverRecords` ADD COLUMN `allocationId` int NULL AFTER `assetId`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @has_handover_ticket := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='handoverRecords' AND COLUMN_NAME='ticketId');
SET @sql := IF(@has_handover_ticket=0, 'ALTER TABLE `handoverRecords` ADD COLUMN `ticketId` int NULL AFTER `allocationId`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS `allocationTemplates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('handover','return') NOT NULL,
  `name` varchar(160) NOT NULL,
  `title` varchar(240) NOT NULL,
  `headerText` text,
  `bodyText` text,
  `footerText` text,
  `active` int NOT NULL DEFAULT 1,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `allocation_templates_type_idx` (`type`),
  KEY `allocation_templates_active_idx` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `allocationTemplates` (`type`,`name`,`title`,`headerText`,`bodyText`,`footerText`,`active`)
SELECT 'handover','Biểu mẫu bàn giao mặc định','BIÊN BẢN BÀN GIAO TÀI SẢN','Đơn vị: {{department}}\nĐịa điểm: {{location}}','Căn cứ nhu cầu quản lý tài sản, các bên thống nhất bàn giao tài sản theo thông tin dưới đây.\nTài sản: {{assetCode}} - {{assetName}}\nNgười nhận: {{userName}}\nPhòng ban: {{department}}\nĐịa điểm: {{location}}\nSerial Number: {{serial}}\nNgày thực hiện: {{date}}\nGhi chú: {{note}}','BÊN GIAO                              NGƯỜI NHẬN\n(Ký, ghi rõ họ tên)                  (Ký, ghi rõ họ tên)',1
WHERE NOT EXISTS (SELECT 1 FROM `allocationTemplates` WHERE `type`='handover' AND `active`=1);

INSERT INTO `allocationTemplates` (`type`,`name`,`title`,`headerText`,`bodyText`,`footerText`,`active`)
SELECT 'return','Biểu mẫu thu hồi mặc định','BIÊN BẢN THU HỒI TÀI SẢN','Đơn vị: {{department}}\nĐịa điểm: {{location}}','Căn cứ nhu cầu quản lý tài sản, các bên thống nhất thu hồi tài sản theo thông tin dưới đây.\nTài sản: {{assetCode}} - {{assetName}}\nNgười bàn giao: {{userName}}\nPhòng ban: {{department}}\nĐịa điểm lưu kho: {{warehouse}}\nSerial Number: {{serial}}\nNgày thực hiện: {{date}}\nGhi chú: {{note}}','BÊN THU HỒI                           NGƯỜI BÀN GIAO\n(Ký, ghi rõ họ tên)                  (Ký, ghi rõ họ tên)',1
WHERE NOT EXISTS (SELECT 1 FROM `allocationTemplates` WHERE `type`='return' AND `active`=1);

SET @has_alloc_ticket_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='assetAllocations' AND INDEX_NAME='asset_allocations_ticket_idx');
SET @sql := IF(@has_alloc_ticket_idx=0, 'ALTER TABLE `assetAllocations` ADD INDEX `asset_allocations_ticket_idx` (`ticketId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @has_alloc_wh_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='assetAllocations' AND INDEX_NAME='asset_allocations_warehouse_idx');
SET @sql := IF(@has_alloc_wh_idx=0, 'ALTER TABLE `assetAllocations` ADD INDEX `asset_allocations_warehouse_idx` (`warehouseId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
