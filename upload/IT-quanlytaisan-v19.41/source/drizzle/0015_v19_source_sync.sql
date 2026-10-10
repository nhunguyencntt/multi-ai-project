-- IT-quanlytaisan v19: source synchronization metadata
-- Non-destructive additions. Existing data is preserved.
SET @db_name = DATABASE();

SET @has_license_warehouse = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema=@db_name AND table_name='licenses' AND column_name='warehouseId'
);
SET @sql_license_warehouse = IF(@has_license_warehouse=0,
  'ALTER TABLE `licenses` ADD COLUMN `warehouseId` int NULL',
  'SELECT 1'
);
PREPARE stmt_license_warehouse FROM @sql_license_warehouse;
EXECUTE stmt_license_warehouse;
DEALLOCATE PREPARE stmt_license_warehouse;

SET @has_network_specs = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema=@db_name AND table_name='networkDevices' AND column_name='specifications'
);
SET @sql_network_specs = IF(@has_network_specs=0,
  'ALTER TABLE `networkDevices` ADD COLUMN `specifications` text NULL',
  'SELECT 1'
);
PREPARE stmt_network_specs FROM @sql_network_specs;
EXECUTE stmt_network_specs;
DEALLOCATE PREPARE stmt_network_specs;
