import "dotenv/config";
import mysql from "mysql2/promise";
import crypto from "node:crypto";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
const q = async (sql, params = []) => connection.execute(sql, params);
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

try {
  await q("SET NAMES utf8mb4");

  const adminUser = process.env.INITIAL_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (adminPassword) {
    const [rows] = await q("SELECT id FROM systemUsers WHERE username=? LIMIT 1", [adminUser]);
    if (!rows.length) {
      await q("INSERT INTO systemUsers (username,fullName,passwordHash,role,active,mustChangePassword) VALUES (?,?,?,?,1,1)", [adminUser, "Quản trị hệ thống", hashPassword(adminPassword), "administrator"]);
    }
  }

  const permissions = [
    ["administrator", "dashboard", 1,1,1,1], ["administrator", "helpdesk",1,1,1,1], ["administrator", "assets",1,1,1,1], ["administrator", "users",1,1,1,1], ["administrator", "inventory",1,1,1,1], ["administrator", "allocation",1,1,1,1], ["administrator", "maintenance",1,1,1,1], ["administrator", "inventory-check",1,1,1,1], ["administrator", "licenses",1,1,1,1], ["administrator", "network",1,1,1,1], ["administrator", "reports",1,1,1,1], ["administrator", "settings",1,1,1,1],
    ["manager", "dashboard",1,0,0,0], ["manager", "assets",1,1,1,0], ["manager", "users",1,1,1,0], ["manager", "allocation",1,1,1,0], ["manager", "reports",1,0,0,0],
    ["operator", "dashboard",1,0,0,0], ["operator", "helpdesk",1,1,1,0], ["operator", "assets",1,1,1,0], ["operator", "inventory",1,1,1,0], ["operator", "maintenance",1,1,1,0], ["operator", "inventory-check",1,1,1,0],
    ["viewer", "dashboard",1,0,0,0], ["viewer", "assets",1,0,0,0], ["viewer", "reports",1,0,0,0],
  ];
  for (const row of permissions) await q("INSERT IGNORE INTO permissionRules (role,module,canView,canCreate,canEdit,canDelete) VALUES (?,?,?,?,?,?)", row);

  const settings = [
    ["app.name", "IT-quanlytaisan", "Tên hệ thống"],
    ["app.version", "1.19.25", "Phiên bản phát hành"],
    ["upload.maxMb", "50", "Dung lượng tệp tối đa"],
    ["upload.directory", process.env.UPLOAD_DIR || "/var/lib/it-quanlytaisan/uploads", "Thư mục lưu tệp runtime"],
  ];
  for (const row of settings) await q("INSERT INTO systemSettings (settingKey,settingValue,description) VALUES (?,?,?) ON DUPLICATE KEY UPDATE settingValue=VALUES(settingValue),description=VALUES(description)", row);

  console.log("Base seed completed. No legacy employees, departments, assets, tickets, licenses or handover records are seeded.");
} finally {
  await connection.end();
}
