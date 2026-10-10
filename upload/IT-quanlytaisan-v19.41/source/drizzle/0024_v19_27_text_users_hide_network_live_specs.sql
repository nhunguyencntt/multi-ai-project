-- v19.27: allow free-text assignee names on allocations; keep historical assetUsers rows for audit compatibility.
SET @has_user_text = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='assetAllocations' AND COLUMN_NAME='userText');
SET @ddl = IF(@has_user_text=0, 'ALTER TABLE assetAllocations ADD COLUMN userText VARCHAR(180) NULL AFTER userId', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @user_id_nullable = (SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='assetAllocations' AND COLUMN_NAME='userId' LIMIT 1);
SET @ddl = IF(@user_id_nullable='NO', 'ALTER TABLE assetAllocations MODIFY COLUMN userId INT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
