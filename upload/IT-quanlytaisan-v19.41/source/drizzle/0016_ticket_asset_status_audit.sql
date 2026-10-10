-- IT-quanlytaisan v19.10
-- Preserve existing ticket data while recording the effective asset status after each ticket update.
SET @db_name = DATABASE();
SET @has_asset_status_after = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema=@db_name AND table_name='ticketUpdates' AND column_name='assetStatusAfter'
);
SET @sql_asset_status_after = IF(@has_asset_status_after=0,
  'ALTER TABLE `ticketUpdates` ADD COLUMN `assetStatusAfter` enum(\'in_use\',\'available\',\'pending_allocation\',\'pending_return\',\'repair\',\'damaged\',\'retired\') NULL AFTER `note`',
  'SELECT 1'
);
PREPARE stmt_asset_status_after FROM @sql_asset_status_after;
EXECUTE stmt_asset_status_after;
DEALLOCATE PREPARE stmt_asset_status_after;
