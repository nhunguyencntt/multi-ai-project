-- v17: Helpdesk department/location linkage and dedicated administrator console.
SET @db := DATABASE();

SET @has_ticket_location := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='tickets' AND COLUMN_NAME='locationId');
SET @sql := IF(@has_ticket_location=0, 'ALTER TABLE `tickets` ADD COLUMN `locationId` int NULL AFTER `departmentId`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @has_ticket_location_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='tickets' AND INDEX_NAME='tickets_location_idx');
SET @sql := IF(@has_ticket_location_idx=0, 'ALTER TABLE `tickets` ADD INDEX `tickets_location_idx` (`locationId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := 'ALTER TABLE `systemUsers` MODIFY COLUMN `role` enum(\'administrator\',\'admin\',\'manager\',\'operator\',\'viewer\') NOT NULL DEFAULT \'operator\'';
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS `systemGroups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `description` text,
  `active` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `system_groups_name_uq` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `systemUserGroups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `groupId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `sug_user_idx` (`userId`), KEY `sug_group_idx` (`groupId`),
  UNIQUE KEY `sug_user_group_uq` (`userId`,`groupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `systemGroupPermissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `groupId` int NOT NULL,
  `module` varchar(80) NOT NULL,
  `canView` int NOT NULL DEFAULT 0,
  `canCreate` int NOT NULL DEFAULT 0,
  `canEdit` int NOT NULL DEFAULT 0,
  `canDelete` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`), KEY `sgp_group_idx` (`groupId`), KEY `sgp_module_idx` (`module`),
  UNIQUE KEY `sgp_group_module_uq` (`groupId`,`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `systemGroups` (`name`,`description`,`active`)
SELECT 'Quản trị hệ thống','Nhóm quản trị toàn bộ tài khoản và phân quyền.',1
WHERE NOT EXISTS (SELECT 1 FROM `systemGroups` WHERE `name`='Quản trị hệ thống');
INSERT INTO `systemGroups` (`name`,`description`,`active`)
SELECT 'Vận hành IT','Nhóm vận hành Helpdesk, tài sản, kho, cấp phát và bảo trì.',1
WHERE NOT EXISTS (SELECT 1 FROM `systemGroups` WHERE `name`='Vận hành IT');
INSERT INTO `systemGroups` (`name`,`description`,`active`)
SELECT 'Chỉ xem','Nhóm chỉ được xem các module được cấp quyền.',1
WHERE NOT EXISTS (SELECT 1 FROM `systemGroups` WHERE `name`='Chỉ xem');

INSERT INTO `systemGroupPermissions` (`groupId`,`module`,`canView`,`canCreate`,`canEdit`,`canDelete`)
SELECT g.id, p.module, p.canView, p.canCreate, p.canEdit, p.canDelete
FROM `systemGroups` g CROSS JOIN (
  SELECT 'assets' module,1 canView,1 canCreate,1 canEdit,0 canDelete UNION ALL
  SELECT 'helpdesk',1,1,1,0 UNION ALL SELECT 'inventory',1,1,1,0 UNION ALL SELECT 'allocation',1,1,1,0 UNION ALL
  SELECT 'maintenance',1,1,1,0 UNION ALL SELECT 'reports',1,0,0,0 UNION ALL SELECT 'settings',1,0,0,0
) p
WHERE g.name='Vận hành IT' AND NOT EXISTS (SELECT 1 FROM `systemGroupPermissions` x WHERE x.groupId=g.id AND x.module=p.module);

INSERT INTO `systemUserGroups` (`userId`,`groupId`)
SELECT u.id, g.id
FROM `systemUsers` u JOIN `systemGroups` g ON g.name='Quản trị hệ thống'
WHERE u.role IN ('administrator','admin')
  AND NOT EXISTS (SELECT 1 FROM `systemUserGroups` x WHERE x.userId=u.id AND x.groupId=g.id);
