CREATE TABLE IF NOT EXISTS `assetSpecificationFields` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `categoryId` int NULL,
  `code` varchar(80) NOT NULL,
  `name` varchar(160) NOT NULL,
  `unit` varchar(40) NULL,
  `fieldType` enum('text','number','textarea') NOT NULL DEFAULT 'text',
  `required` int NOT NULL DEFAULT 0,
  `sortOrder` int NOT NULL DEFAULT 0,
  `active` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `asset_spec_fields_code_unique` (`code`),
  INDEX `asset_spec_fields_category_idx` (`categoryId`),
  INDEX `asset_spec_fields_active_idx` (`active`)
);

CREATE TABLE IF NOT EXISTS `assetSpecificationValues` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `assetId` int NOT NULL,
  `fieldId` int NOT NULL,
  `value` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `asset_spec_values_asset_idx` (`assetId`),
  INDEX `asset_spec_values_field_idx` (`fieldId`)
);

INSERT IGNORE INTO `assetSpecificationFields` (`categoryId`,`code`,`name`,`unit`,`fieldType`,`required`,`sortOrder`,`active`) VALUES
(NULL,'cpu','CPU',NULL,'text',0,10,1),
(NULL,'ram','RAM','GB','text',0,20,1),
(NULL,'storage','Ổ cứng',NULL,'text',0,30,1),
(NULL,'display','Màn hình',NULL,'text',0,40,1),
(NULL,'gpu','Card màn hình',NULL,'text',0,50,1),
(NULL,'mainboard','Mainboard',NULL,'text',0,60,1),
(NULL,'brand','Hãng sản xuất',NULL,'text',0,70,1),
(NULL,'model','Model',NULL,'text',0,80,1);

INSERT IGNORE INTO `assetSpecificationFields` (`categoryId`,`code`,`name`,`unit`,`fieldType`,`required`,`sortOrder`,`active`) VALUES (NULL,'legacy_specifications','Thông số cũ',NULL,'textarea',0,999,1);
INSERT INTO `assetSpecificationValues` (`assetId`,`fieldId`,`value`)
SELECT a.id, f.id, a.specifications
FROM `assets` a JOIN `assetSpecificationFields` f ON f.code='legacy_specifications'
LEFT JOIN `assetSpecificationValues` v ON v.assetId=a.id AND v.fieldId=f.id
WHERE a.specifications IS NOT NULL AND TRIM(a.specifications) <> '' AND v.id IS NULL;
