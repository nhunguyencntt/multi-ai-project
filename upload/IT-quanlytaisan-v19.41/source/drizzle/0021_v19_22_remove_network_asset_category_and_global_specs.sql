-- v19.22
-- 1) Hạ tầng & Mạng is a separate operational source and must not appear as
--    an asset category in Cấu hình danh mục.
-- 2) Keep the mirrored NET-* asset rows for backward compatibility, but detach
--    them from the asset-category catalog.
-- 3) Re-clean any legacy/common technical specification fields and values.

CREATE TABLE IF NOT EXISTS itq_schema_versions (
  version varchar(40) PRIMARY KEY,
  appliedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Detach network-mirrored assets from the catalog before removing the category.
UPDATE assets a
JOIN assetCategories c ON c.id = a.categoryId
SET a.categoryId = NULL
WHERE LOWER(TRIM(c.name)) = 'hạ tầng & mạng'
   OR a.assetCode LIKE 'NET-%';

-- Remove specification values, links and fields that belonged only to the
-- obsolete Hạ tầng & Mạng category.
DELETE v
FROM assetSpecificationValues v
JOIN assetSpecificationFields f ON f.id = v.fieldId
JOIN assetCategories c ON c.id = f.categoryId
WHERE LOWER(TRIM(c.name)) = 'hạ tầng & mạng';

DELETE l
FROM assetSpecificationFieldCategories l
JOIN assetCategories c ON c.id = l.categoryId
WHERE LOWER(TRIM(c.name)) = 'hạ tầng & mạng';

DELETE l
FROM assetSpecificationFieldCategories l
LEFT JOIN assetSpecificationFields f ON f.id = l.fieldId
WHERE f.id IS NULL OR f.categoryId IS NULL;

DELETE f
FROM assetSpecificationFields f
JOIN assetCategories c ON c.id = f.categoryId
WHERE LOWER(TRIM(c.name)) = 'hạ tầng & mạng';

-- Remove the obsolete category itself.
DELETE FROM assetCategories
WHERE LOWER(TRIM(name)) = 'hạ tầng & mạng';

-- Remove any legacy/global specification fields and their structured values.
DELETE v
FROM assetSpecificationValues v
JOIN assetSpecificationFields f ON f.id = v.fieldId
WHERE f.categoryId IS NULL;

DELETE l
FROM assetSpecificationFieldCategories l
LEFT JOIN assetSpecificationFields f ON f.id = l.fieldId
WHERE f.id IS NULL OR f.categoryId IS NULL;

DELETE FROM assetSpecificationFields WHERE categoryId IS NULL;

INSERT IGNORE INTO itq_schema_versions(version) VALUES ('v19.22');
