-- IT-quanlytaisan v19.16: group-only module permissions.
CREATE TABLE IF NOT EXISTS `systemGroups` (
  `id` int NOT NULL AUTO_INCREMENT, `name` varchar(120) NOT NULL, `description` text, `active` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `system_groups_name_uq` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `systemUserGroups` (
  `id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `groupId` int NOT NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `sug_user_group_uq` (`userId`,`groupId`), KEY `sug_user_idx` (`userId`), KEY `sug_group_idx` (`groupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `systemGroupPermissions` (
  `id` int NOT NULL AUTO_INCREMENT, `groupId` int NOT NULL, `module` varchar(80) NOT NULL, `canView` int NOT NULL DEFAULT 0, `canCreate` int NOT NULL DEFAULT 0, `canEdit` int NOT NULL DEFAULT 0, `canDelete` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`), UNIQUE KEY `sgp_group_module_uq` (`groupId`,`module`), KEY `sgp_group_idx` (`groupId`), KEY `sgp_module_idx` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `systemGroups` (`name`,`description`,`active`) SELECT 'Quản lý','Nhóm quản lý vận hành và báo cáo.',1 WHERE NOT EXISTS (SELECT 1 FROM `systemGroups` WHERE `name`='Quản lý');
INSERT INTO `systemGroups` (`name`,`description`,`active`) SELECT 'Admin vận hành','Nhóm quản trị module vận hành do Admin cấu hình.',1 WHERE NOT EXISTS (SELECT 1 FROM `systemGroups` WHERE `name`='Admin vận hành');

INSERT INTO `systemGroupPermissions` (`groupId`,`module`,`canView`,`canCreate`,`canEdit`,`canDelete`)
SELECT g.id,p.module,p.canView,p.canCreate,p.canEdit,p.canDelete FROM `systemGroups` g CROSS JOIN (
 SELECT 'helpdesk' module,1 canView,1 canCreate,1 canEdit,0 canDelete UNION ALL
 SELECT 'assets',1,1,1,0 UNION ALL SELECT 'users',1,1,1,0 UNION ALL SELECT 'inventory',1,1,1,0 UNION ALL
 SELECT 'allocation',1,1,1,0 UNION ALL SELECT 'maintenance',1,1,1,0 UNION ALL SELECT 'licenses',1,1,1,0 UNION ALL
 SELECT 'network',1,1,1,0 UNION ALL SELECT 'reports',1,0,0,0 UNION ALL SELECT 'settings',1,0,0,0
) p WHERE g.name='Quản lý' AND NOT EXISTS (SELECT 1 FROM `systemGroupPermissions` x WHERE x.groupId=g.id AND x.module=p.module);

INSERT INTO `systemGroupPermissions` (`groupId`,`module`,`canView`,`canCreate`,`canEdit`,`canDelete`)
SELECT g.id,p.module,p.canView,p.canCreate,p.canEdit,p.canDelete FROM `systemGroups` g CROSS JOIN (
 SELECT 'helpdesk' module,1 canView,1 canCreate,1 canEdit,1 canDelete UNION ALL SELECT 'assets',1,1,1,1 UNION ALL SELECT 'users',1,1,1,1 UNION ALL
 SELECT 'inventory',1,1,1,1 UNION ALL SELECT 'allocation',1,1,1,1 UNION ALL SELECT 'maintenance',1,1,1,1 UNION ALL
 SELECT 'licenses',1,1,1,1 UNION ALL SELECT 'network',1,1,1,1 UNION ALL SELECT 'reports',1,1,1,1 UNION ALL SELECT 'settings',1,1,1,1
) p WHERE g.name='Admin vận hành' AND NOT EXISTS (SELECT 1 FROM `systemGroupPermissions` x WHERE x.groupId=g.id AND x.module=p.module);

-- Ensure existing role-based accounts have at least one custom group. Existing explicit group memberships are preserved.
INSERT INTO `systemUserGroups` (`userId`,`groupId`)
SELECT u.id,g.id FROM `systemUsers` u JOIN `systemGroups` g ON g.name='Quản trị hệ thống'
WHERE u.role IN ('administrator','admin') AND NOT EXISTS (SELECT 1 FROM `systemUserGroups` x WHERE x.userId=u.id);
INSERT INTO `systemUserGroups` (`userId`,`groupId`)
SELECT u.id,g.id FROM `systemUsers` u JOIN `systemGroups` g ON g.name='Quản lý'
WHERE u.role='manager' AND NOT EXISTS (SELECT 1 FROM `systemUserGroups` x WHERE x.userId=u.id);
INSERT INTO `systemUserGroups` (`userId`,`groupId`)
SELECT u.id,g.id FROM `systemUsers` u JOIN `systemGroups` g ON g.name='Vận hành IT'
WHERE u.role='operator' AND NOT EXISTS (SELECT 1 FROM `systemUserGroups` x WHERE x.userId=u.id);
INSERT INTO `systemUserGroups` (`userId`,`groupId`)
SELECT u.id,g.id FROM `systemUsers` u JOIN `systemGroups` g ON g.name='Chỉ xem'
WHERE u.role='viewer' AND NOT EXISTS (SELECT 1 FROM `systemUserGroups` x WHERE x.userId=u.id);
