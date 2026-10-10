CREATE TABLE `assetCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	CONSTRAINT `assetCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `assetCategories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetCode` varchar(80) NOT NULL,
	`name` varchar(240) NOT NULL,
	`categoryId` int,
	`departmentId` int,
	`locationId` int,
	`assignedUserId` int,
	`managerUserId` int,
	`status` enum('in_use','available','repair','retired','lost') NOT NULL DEFAULT 'available',
	`serialNumber` varchar(120),
	`specifications` text,
	`note` text,
	`acquiredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_assetCode_unique` UNIQUE(`assetCode`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `handoverRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentCode` varchar(80) NOT NULL,
	`assetId` int,
	`fromUserId` int,
	`toUserId` int,
	`type` enum('handover','return') NOT NULL,
	`documentUrl` text,
	`note` text,
	`happenedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `handoverRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `handoverRecords_documentCode_unique` UNIQUE(`documentCode`)
);
--> statement-breakpoint
CREATE TABLE `inventoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemCode` varchar(80) NOT NULL,
	`name` varchar(240) NOT NULL,
	`categoryId` int,
	`locationId` int,
	`unit` varchar(40) NOT NULL DEFAULT 'cái',
	`quantity` int NOT NULL DEFAULT 0,
	`minimumQuantity` int NOT NULL DEFAULT 0,
	`note` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventoryItems_itemCode_unique` UNIQUE(`itemCode`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `locations_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`requestedById` int,
	`assignedToId` int,
	`status` enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
	`issue` text NOT NULL,
	`resolution` text,
	`costNote` varchar(160),
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `maintenanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticketUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`authorId` int,
	`status` enum('new','in_progress','waiting_user','completed') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticketUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketCode` varchar(40) NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`requesterId` int,
	`departmentId` int,
	`assigneeId` int,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('new','in_progress','waiting_user','completed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_ticketCode_unique` UNIQUE(`ticketCode`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(160);--> statement-breakpoint
CREATE INDEX `assets_status_idx` ON `assets` (`status`);--> statement-breakpoint
CREATE INDEX `assets_department_idx` ON `assets` (`departmentId`);--> statement-breakpoint
CREATE INDEX `assets_assigned_idx` ON `assets` (`assignedUserId`);--> statement-breakpoint
CREATE INDEX `ticket_updates_ticket_idx` ON `ticketUpdates` (`ticketId`);--> statement-breakpoint
CREATE INDEX `tickets_status_idx` ON `tickets` (`status`);--> statement-breakpoint
CREATE INDEX `tickets_department_idx` ON `tickets` (`departmentId`);--> statement-breakpoint
CREATE INDEX `tickets_priority_idx` ON `tickets` (`priority`);