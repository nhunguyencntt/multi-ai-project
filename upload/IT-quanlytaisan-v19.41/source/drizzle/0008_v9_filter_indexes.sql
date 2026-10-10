-- v9: indexes supporting the UI filter model.
-- Safe for existing data; no records are deleted or rewritten.
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'assets' AND index_name = 'assets_location_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX assets_location_idx ON assets(locationId)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'assets' AND index_name = 'assets_category_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX assets_category_idx ON assets(categoryId)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'assets' AND index_name = 'assets_serial_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX assets_serial_idx ON assets(serialNumber)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'assets' AND index_name = 'assets_user_text_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX assets_user_text_idx ON assets(userText)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'tickets' AND index_name = 'tickets_asset_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX tickets_asset_idx ON tickets(assetId)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'maintenanceRecords' AND index_name = 'maintenance_asset_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX maintenance_asset_idx ON maintenanceRecords(assetId)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'maintenanceRecords' AND index_name = 'maintenance_ticket_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX maintenance_ticket_idx ON maintenanceRecords(ticketId)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'inventoryItems' AND index_name = 'inventory_location_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX inventory_location_idx ON inventoryItems(locationId)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'maintenanceRecords' AND index_name = 'maintenance_status_idx');
SET @sql := IF(@idx = 0, 'CREATE INDEX maintenance_status_idx ON maintenanceRecords(status)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
