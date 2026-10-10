import "dotenv/config";
import mysql from "mysql2/promise";

if (process.argv.includes("--help")) {
  console.log("DANGER: clears business data while preserving systemUsers, permissions and settings. Use --confirm=EMPTY.");
  process.exit(0);
}
if (!process.argv.includes("--confirm=EMPTY")) {
  console.error("Refusing to reset database. Pass --confirm=EMPTY explicitly.");
  process.exit(2);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const db = await mysql.createConnection({uri: process.env.DATABASE_URL, multipleStatements:true});
const tables = [
  "allocationLicenses","handoverRecords","handoverDocuments","assetAllocations",
  "ticketUpdates","tickets","maintenanceRecords","attachmentFiles",
  "assetSpecificationValues","assetSpecificationFieldCategories","assetSpecificationFields",
  "assets","inventoryItems","inventoryChecks","inventoryWarehouses","licenses",
  "networkDevices","reportTemplates","assetUsers","locations","assetCategories","departments"
];
try {
  await db.query("SET FOREIGN_KEY_CHECKS=0");
  for (const table of tables) {
    try { await db.query(`TRUNCATE TABLE \`${table}\``); } catch (e) { console.warn(`Skip ${table}: ${e.message}`); }
  }
  await db.query("DELETE FROM systemUserSessions");
  await db.query("DELETE FROM systemActivityLogs");
  await db.query("SET FOREIGN_KEY_CHECKS=1");
  console.log("Database business data reset to empty. systemUsers, permissionRules and systemSettings were preserved.");
} finally {
  await db.end();
}
