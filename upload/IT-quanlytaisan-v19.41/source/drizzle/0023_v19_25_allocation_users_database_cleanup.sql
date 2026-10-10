-- IT-quanlytaisan v19.25
-- Final reconciliation of legacy departments/users and allocation data.
-- This migration never deletes current assets, active allocations or historical handover rows.

SET @db := DATABASE();
CREATE TABLE IF NOT EXISTS itq_schema_versions (
  version varchar(40) PRIMARY KEY,
  appliedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1. Reconcile legacy department aliases using BOTH name and code.
DROP TEMPORARY TABLE IF EXISTS itq_department_aliases;
CREATE TEMPORARY TABLE itq_department_aliases (legacy_value varchar(160) NOT NULL, canonical_code varchar(40) NOT NULL);
INSERT INTO itq_department_aliases VALUES
  ('Ban Cà Mau','BCM'),('Ban Cần Thơ','BCT'),('Ban Quảng Trị','BQT'),('Ban Đông Anh','BĐA'),
  ('Ban Đội Cấn','BĐC'),('P.KD','KD'),('P.QLTK','QLTK'),('P.TCHC&KH','TCHC&KH'),('P.TCKT','TCKT');

INSERT IGNORE INTO departments (code,name,active) VALUES
 ('BCM','BCM',1),('BCT','BCT',1),('BQT','BQT',1),('BĐA','BĐA',1),('BĐC','BĐC',1),
 ('KD','KD',1),('QLTK','QLTK',1),('TCHC&KH','TCHC&KH',1),('TCKT','TCKT',1);

-- Move every known legacy reference, matching either legacy name OR legacy code.
UPDATE assets a JOIN departments oldd ON oldd.id=a.departmentId JOIN itq_department_aliases m ON (LOWER(TRIM(oldd.name))=LOWER(TRIM(m.legacy_value)) OR LOWER(TRIM(oldd.code))=LOWER(TRIM(m.legacy_value))) JOIN departments newd ON newd.code=m.canonical_code SET a.departmentId=newd.id WHERE oldd.id<>newd.id;
UPDATE assetUsers u JOIN departments oldd ON oldd.id=u.departmentId JOIN itq_department_aliases m ON (LOWER(TRIM(oldd.name))=LOWER(TRIM(m.legacy_value)) OR LOWER(TRIM(oldd.code))=LOWER(TRIM(m.legacy_value))) JOIN departments newd ON newd.code=m.canonical_code SET u.departmentId=newd.id WHERE oldd.id<>newd.id;
UPDATE tickets t JOIN departments oldd ON oldd.id=t.departmentId JOIN itq_department_aliases m ON (LOWER(TRIM(oldd.name))=LOWER(TRIM(m.legacy_value)) OR LOWER(TRIM(oldd.code))=LOWER(TRIM(m.legacy_value))) JOIN departments newd ON newd.code=m.canonical_code SET t.departmentId=newd.id WHERE oldd.id<>newd.id;
UPDATE assetAllocations a JOIN departments oldd ON oldd.id=a.departmentId JOIN itq_department_aliases m ON (LOWER(TRIM(oldd.name))=LOWER(TRIM(m.legacy_value)) OR LOWER(TRIM(oldd.code))=LOWER(TRIM(m.legacy_value))) JOIN departments newd ON newd.code=m.canonical_code SET a.departmentId=newd.id WHERE oldd.id<>newd.id;
UPDATE inventoryChecks i JOIN departments oldd ON oldd.id=i.departmentId JOIN itq_department_aliases m ON (LOWER(TRIM(oldd.name))=LOWER(TRIM(m.legacy_value)) OR LOWER(TRIM(oldd.code))=LOWER(TRIM(m.legacy_value))) JOIN departments newd ON newd.code=m.canonical_code SET i.departmentId=newd.id WHERE oldd.id<>newd.id;
UPDATE reportTemplates r JOIN departments oldd ON oldd.id=r.departmentId JOIN itq_department_aliases m ON (LOWER(TRIM(oldd.name))=LOWER(TRIM(m.legacy_value)) OR LOWER(TRIM(oldd.code))=LOWER(TRIM(m.legacy_value))) JOIN departments newd ON newd.code=m.canonical_code SET r.departmentId=newd.id WHERE oldd.id<>newd.id;

DELETE oldd FROM departments oldd JOIN itq_department_aliases m ON (LOWER(TRIM(oldd.name))=LOWER(TRIM(m.legacy_value)) OR LOWER(TRIM(oldd.code))=LOWER(TRIM(m.legacy_value))) JOIN departments newd ON newd.code=m.canonical_code WHERE oldd.id<>newd.id;
DROP TEMPORARY TABLE itq_department_aliases;

-- 2. Legacy assetUsers from old seed directories are not shown in allocation/helpdesk anymore.
-- Keep any user that is currently assigned to a live asset or a non-returned allocation.
-- Historical-only users remain in the table but are inactive, preserving audit references.
UPDATE assetUsers u
LEFT JOIN (SELECT DISTINCT assignedUserId AS userId FROM assets WHERE assignedUserId IS NOT NULL AND status <> 'retired') liveAssets ON liveAssets.userId=u.id
LEFT JOIN (SELECT DISTINCT userId FROM assetAllocations WHERE status IN ('pending_allocation','active','pending_return')) liveAlloc ON liveAlloc.userId=u.id
SET u.active=CASE WHEN liveAssets.userId IS NOT NULL OR liveAlloc.userId IS NOT NULL THEN 1 ELSE 0 END;

-- 3. Remove orphan license links and specification links left by old upgrades.
DELETE al FROM allocationLicenses al LEFT JOIN assetAllocations a ON a.id=al.allocationId LEFT JOIN licenses l ON l.id=al.licenseId WHERE a.id IS NULL OR l.id IS NULL;
DELETE sv FROM assetSpecificationValues sv LEFT JOIN assetSpecificationFields sf ON sf.id=sv.fieldId LEFT JOIN assets a ON a.id=sv.assetId WHERE sf.id IS NULL OR a.id IS NULL;
DELETE sl FROM assetSpecificationFieldCategories sl LEFT JOIN assetSpecificationFields sf ON sf.id=sl.fieldId LEFT JOIN assetCategories c ON c.id=sl.categoryId WHERE sf.id IS NULL OR c.id IS NULL;

INSERT IGNORE INTO itq_schema_versions(version) VALUES ('v19.25');
