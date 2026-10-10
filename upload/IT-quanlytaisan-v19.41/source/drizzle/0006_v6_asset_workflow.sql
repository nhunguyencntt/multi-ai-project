ALTER TABLE assets ADD COLUMN userText varchar(180) NULL AFTER locationId;
ALTER TABLE assets MODIFY COLUMN status enum('in_use','available','repair','damaged','retired','lost') NOT NULL DEFAULT 'available';
ALTER TABLE tickets ADD COLUMN assetId int NULL AFTER assigneeId;
ALTER TABLE maintenanceRecords ADD COLUMN ticketId int NULL AFTER assignedToId;
UPDATE assets a LEFT JOIN assetUsers u ON u.id = a.assignedUserId SET a.userText = u.fullName WHERE a.userText IS NULL AND a.assignedUserId IS NOT NULL;
