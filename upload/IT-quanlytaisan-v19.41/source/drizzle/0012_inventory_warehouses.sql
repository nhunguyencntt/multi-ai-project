-- v15: inventory warehouse management. Safe/idempotent for existing installations.
CREATE TABLE IF NOT EXISTS `inventoryWarehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(160) NOT NULL,
  `note` text,
  `active` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_warehouses_name_unique` (`name`),
  KEY `inventory_warehouses_active_idx` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @has_wh_col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='inventoryItems' AND COLUMN_NAME='warehouseId');
SET @add_wh_sql := IF(@has_wh_col=0, 'ALTER TABLE `inventoryItems` ADD COLUMN `warehouseId` int NULL AFTER `locationId`', 'SELECT 1');
PREPARE stmt FROM @add_wh_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_wh_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='inventoryItems' AND INDEX_NAME='inventory_items_warehouse_idx');
SET @add_wh_idx_sql := IF(@has_wh_idx=0, 'ALTER TABLE `inventoryItems` ADD INDEX `inventory_items_warehouse_idx` (`warehouseId`)', 'SELECT 1');
PREPARE stmt2 FROM @add_wh_idx_sql; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

INSERT IGNORE INTO `inventoryWarehouses` (`name`,`note`,`active`) VALUES
('Kho IT','Kho thiết bị và vật tư CNTT',1),
('Kho Hành chính','Kho vật tư hành chính',1),
('Kho Lầu Tam Hiệp','Kho lưu trữ tại Lầu Tam Hiệp',1);
