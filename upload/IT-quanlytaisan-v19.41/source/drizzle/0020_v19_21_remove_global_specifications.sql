-- v19.21: remove global/common technical specification fields and clean their structured values.
-- The legacy assets.specifications text column is intentionally preserved.

SET @db := DATABASE();

CREATE TABLE IF NOT EXISTS itq_schema_versions (version varchar(40) PRIMARY KEY, appliedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP);

-- Remove structured values belonging to fields that were configured as global/common.
DELETE v FROM assetSpecificationValues v
JOIN assetSpecificationFields f ON f.id=v.fieldId
WHERE f.categoryId IS NULL;

-- Remove category links for global fields before deleting the fields themselves.
DELETE l FROM assetSpecificationFieldCategories l
LEFT JOIN assetSpecificationFields f ON f.id=l.fieldId
WHERE f.id IS NULL OR f.categoryId IS NULL;

DELETE FROM assetSpecificationFields WHERE categoryId IS NULL;

-- From v19.21 onward a specification must belong to at least one asset category.
-- Existing category-scoped fields remain untouched.

INSERT IGNORE INTO itq_schema_versions(version) VALUES ('v19.21');
