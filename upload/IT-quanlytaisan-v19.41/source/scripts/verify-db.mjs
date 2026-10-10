import "dotenv/config";
import mysql from "mysql2/promise";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection({uri: process.env.DATABASE_URL});
const checks = [
  ["assets", "SELECT COUNT(*) c FROM assets"],
  ["assetUsers", "SELECT COUNT(*) c FROM assetUsers"],
  ["handoverDocuments", "SELECT COUNT(*) c FROM handoverDocuments"],
  ["handoverRecords", "SELECT COUNT(*) c FROM handoverRecords"],
  ["tickets", "SELECT COUNT(*) c FROM tickets"],
  ["assetSpecificationFields", "SELECT COUNT(*) c FROM assetSpecificationFields"],
  ["allocationLicenses", "SELECT COUNT(*) c FROM allocationLicenses"],
  ["inventoryWarehouses", "SELECT COUNT(*) c FROM inventoryWarehouses"],
];
for (const [name, sql] of checks) { const [rows] = await db.query(sql); console.log(`${name}: ${rows[0].c}`); }

const [forbiddenCategories] = await db.query(`SELECT id,name FROM assetCategories WHERE LOWER(TRIM(name)) IN ('hạ tầng & mạng','bản quyền & dịch vụ')`);
if (forbiddenCategories.length) throw new Error(`Database vẫn còn danh mục nghiệp vụ trong assetCategories: ${forbiddenCategories.map(x=>x.name).join(', ')}`);

const [forbiddenFields] = await db.query(`SELECT id,code,name,categoryId FROM assetSpecificationFields WHERE categoryId IS NULL OR LOWER(code) REGEXP '^(manufacturer|model|brand)(_|$)'`);
if (forbiddenFields.length) throw new Error(`Database vẫn còn thông số dùng chung/legacy: ${forbiddenFields.map(x=>x.code).join(', ')}`);

const [orphanLinks] = await db.query(`SELECT l.id FROM assetSpecificationFieldCategories l LEFT JOIN assetSpecificationFields f ON f.id=l.fieldId LEFT JOIN assetCategories c ON c.id=l.categoryId WHERE f.id IS NULL OR c.id IS NULL LIMIT 1`);
if (orphanLinks.length) throw new Error('Database vẫn còn liên kết thông số kỹ thuật mồ côi.');

const [legacyDepartments] = await db.query(`SELECT id,name,code FROM departments WHERE LOWER(TRIM(name)) IN ('ban cà mau','ban cần thơ','ban quảng trị','ban đông anh','ban đội cấn','p.kd','p.qltk','p.tchc&kh','p.tckt') OR LOWER(TRIM(code)) IN ('ban cà mau','ban cần thơ','ban quảng trị','ban đông anh','ban đội cấn','p.kd','p.qltk','p.tchc&kh','p.tckt')`);
if (legacyDepartments.length) throw new Error(`Database vẫn còn bộ phận alias legacy: ${legacyDepartments.map(x=>`${x.name}/${x.code}`).join(', ')}`);

const [legacyActiveUsers] = await db.query(`SELECT id,fullName FROM assetUsers WHERE active=1 AND id NOT IN (SELECT assignedUserId FROM assets WHERE assignedUserId IS NOT NULL AND status <> 'retired') AND id NOT IN (SELECT userId FROM assetAllocations WHERE status IN ('pending_allocation','active','pending_return'))`);
if (legacyActiveUsers.length) throw new Error(`Database còn người sử dụng legacy đang active nhưng không có dữ liệu vận hành hiện tại: ${legacyActiveUsers.map(x=>x.fullName).join(', ')}`);
console.log('v19.25 database integrity checks: OK');
await db.end();
