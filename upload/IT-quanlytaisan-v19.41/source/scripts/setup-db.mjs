import "dotenv/config";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, multipleStatements: true });
try {
  for (const file of ["0002_it_quanlytaisan.sql", "0003_asset_specifications.sql", "0004_specification_admin.sql", "0005_complete_operational_modules.sql"]) {
    const sql = await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8");
    await connection.query(sql);
  }
  await connection.query(`CREATE TABLE IF NOT EXISTS itq_schema_versions (version varchar(40) PRIMARY KEY, appliedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  const [versionRows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v6' LIMIT 1`);
  if (!versionRows.length) {
    const sql = await readFile(new URL(`../drizzle/0006_v6_asset_workflow.sql`, import.meta.url), "utf8");
    await connection.query(sql);
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v6')`);
    console.log("IT-quanlytaisan v6 database extensions applied.");
  } else {
    console.log("IT-quanlytaisan v6 database extensions already applied.");
  }
  const [v61Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v6.1' LIMIT 1`);
  if (!v61Rows.length) {
    const sql = await readFile(new URL(`../drizzle/0007_remove_lost_asset_status.sql`, import.meta.url), "utf8");
    await connection.query(sql);
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v6.1')`);
    console.log("IT-quanlytaisan v6.1 database extensions applied.");
  } else {
    console.log("IT-quanlytaisan v6.1 database extensions already applied.");
  }
  const [v9Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v9' LIMIT 1`);
  if (!v9Rows.length) {
    const sql = await readFile(new URL(`../drizzle/0008_v9_filter_indexes.sql`, import.meta.url), "utf8");
    await connection.query(sql);
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v9')`);
    console.log("IT-quanlytaisan v9 filter indexes applied.");
  } else {
    console.log("IT-quanlytaisan v9 filter indexes already applied.");
  }
  const [v10Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v10' LIMIT 1`);
  if (!v10Rows.length) {
    const sql = await readFile(new URL(`../drizzle/0009_v10_sessions_spec_categories.sql`, import.meta.url), "utf8");
    await connection.query(sql);
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v10')`);
    console.log("IT-quanlytaisan v10 database extensions applied.");
  } else {
    console.log("IT-quanlytaisan v10 database extensions already applied.");
  }
  // Repair pass: v9-v11 SQL is idempotent. Always re-apply it so a database whose
  // version marker exists but whose tables/indexes are incomplete can self-heal.
  for (const file of ["0008_v9_filter_indexes.sql", "0009_v10_sessions_spec_categories.sql", "0010_v11_network_reports.sql"]) {
    const sql = await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8");
    await connection.query(sql);
  }
  const v12Repair = await readFile(new URL(`../drizzle/0011_v13_system_hardening.sql`, import.meta.url), "utf8");
  await connection.query(v12Repair);

  const [v12Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v13' LIMIT 1`);
  if (!v12Rows.length) {
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v13')`);
    console.log("IT-quanlytaisan v13 system hardening applied.");
  }

  const [v11Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v11' LIMIT 1`);
  if (!v11Rows.length) {
    const sql = await readFile(new URL(`../drizzle/0010_v11_network_reports.sql`, import.meta.url), "utf8");
    await connection.query(sql);
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v11')`);
    console.log("IT-quanlytaisan v11 network/report extensions applied.");
  } else {
    console.log("IT-quanlytaisan v11 network/report extensions already applied.");
  }
  const [v15Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v15' LIMIT 1`);
  if (!v15Rows.length) {
    const sql = await readFile(new URL(`../drizzle/0012_inventory_warehouses.sql`, import.meta.url), "utf8");
    await connection.query(sql);
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v15')`);
    console.log("IT-quanlytaisan v15 inventory warehouse extensions applied.");
  } else {
    // Keep the migration idempotent and repair a partially restored server.
    const sql = await readFile(new URL(`../drizzle/0012_inventory_warehouses.sql`, import.meta.url), "utf8");
    await connection.query(sql);
  }


  const sqlV16 = await readFile(new URL(`../drizzle/0013_allocation_workflow.sql`, import.meta.url), "utf8");
  await connection.query(sqlV16);
  const [v16Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v16' LIMIT 1`);
  if (!v16Rows.length) {
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v16')`);
    console.log("IT-quanlytaisan v16 allocation workflow extensions applied.");
  } else {
    console.log("IT-quanlytaisan v16 allocation workflow extensions already applied.");
  }

  const sqlV17 = await readFile(new URL(`../drizzle/0014_admin_groups_ticket_location.sql`, import.meta.url), "utf8");
  await connection.query(sqlV17);
  const [v17Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v17' LIMIT 1`);
  if (!v17Rows.length) {
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v17')`);
    console.log("IT-quanlytaisan v17 administrator console and ticket location extensions applied.");
  } else {
    console.log("IT-quanlytaisan v17 administrator console extensions already applied.");
  }

  const sqlV19 = await readFile(new URL(`../drizzle/0015_v19_source_sync.sql`, import.meta.url), "utf8");
  await connection.query(sqlV19);
  const [v19Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v19' LIMIT 1`);
  if (!v19Rows.length) {
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v19')`);
    console.log("IT-quanlytaisan v19 source synchronization extensions applied.");
  } else {
    console.log("IT-quanlytaisan v19 source synchronization extensions already applied.");
  }

  const sqlV1910 = await readFile(new URL(`../drizzle/0016_ticket_asset_status_audit.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1910);
  const [v1910Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v19.10' LIMIT 1`);
  if (!v1910Rows.length) {
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v19.10')`);
    console.log("IT-quanlytaisan v19.10 ticket asset-status audit extension applied.");
  } else {
    console.log("IT-quanlytaisan v19.10 ticket asset-status audit extension already applied.");
  }

  const sqlV1914 = await readFile(new URL(`../drizzle/0017_allocation_license_links.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1914);
  const [v1914Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v19.14' LIMIT 1`);
  if (!v1914Rows.length) {
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v19.14')`);
    console.log("IT-quanlytaisan v19.14 allocation license links applied.");
  } else {
    console.log("IT-quanlytaisan v19.14 allocation license links already applied.");
  }

  const sqlV1916 = await readFile(new URL(`../drizzle/0018_group_only_permissions.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1916);
  const [v1916Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v19.16' LIMIT 1`);
  if (!v1916Rows.length) {
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v19.16')`);
    console.log("IT-quanlytaisan v19.16 group-only permissions applied.");
  } else {
    console.log("IT-quanlytaisan v19.16 group-only permissions already applied.");
  }

  const sqlV1919 = await readFile(new URL(`../drizzle/0019_v19_19_allocation_history_templates.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1919);
  const [v1919Rows] = await connection.query(`SELECT version FROM itq_schema_versions WHERE version='v19.19' LIMIT 1`);
  if (!v1919Rows.length) {
    await connection.query(`INSERT INTO itq_schema_versions(version) VALUES ('v19.19')`);
    console.log("IT-quanlytaisan v19.19 allocation history/template extensions applied.");
  } else {
    console.log("IT-quanlytaisan v19.19 allocation history/template extensions already applied.");
  }

  const sqlV1921 = await readFile(new URL(`../drizzle/0020_v19_21_remove_global_specifications.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1921);
  console.log("IT-quanlytaisan v19.21 category-scoped specifications cleanup applied.");

  const sqlV1922 = await readFile(new URL(`../drizzle/0021_v19_22_remove_network_asset_category_and_global_specs.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1922);
  console.log("IT-quanlytaisan v19.22 network asset category and global specifications cleanup applied.");

  const sqlV1924 = await readFile(new URL(`../drizzle/0022_v19_24_database_cleanup.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1924);
  console.log("IT-quanlytaisan v19.24 legacy database cleanup applied before v19.25 reconciliation.");

  const sqlV1925 = await readFile(new URL(`../drizzle/0023_v19_25_allocation_users_database_cleanup.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1925);
  console.log("IT-quanlytaisan v19.25 allocation/user/database cleanup applied.");

  const sqlV1927 = await readFile(new URL(`../drizzle/0024_v19_27_text_users_hide_network_live_specs.sql`, import.meta.url), "utf8");
  await connection.query(sqlV1927);
  console.log("IT-quanlytaisan v19.27 free-text allocation users migration applied.");

  console.log("IT-quanlytaisan database extensions applied.");
} finally { await connection.end(); }
