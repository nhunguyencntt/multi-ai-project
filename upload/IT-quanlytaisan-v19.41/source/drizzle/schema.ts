import { int, index, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 160 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const locations = mysqlTable("locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  description: text("description"),
  active: int("active").default(1).notNull(),
});

export const assetCategories = mysqlTable("assetCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  description: text("description"),
});

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  assetCode: varchar("assetCode", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 240 }).notNull(),
  categoryId: int("categoryId"),
  departmentId: int("departmentId"),
  locationId: int("locationId"),
  warehouseId: int("warehouseId"),
  userText: varchar("userText", { length: 180 }),
  assignedUserId: int("assignedUserId"),
  managerUserId: int("managerUserId"),
  status: mysqlEnum("status", ["in_use", "available", "pending_allocation", "pending_return", "repair", "damaged", "retired"]).default("available").notNull(),
  serialNumber: varchar("serialNumber", { length: 120 }),
  specifications: text("specifications"),
  note: text("note"),
  acquiredAt: timestamp("acquiredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ statusIdx: index("assets_status_idx").on(table.status), departmentIdx: index("assets_department_idx").on(table.departmentId), locationIdx: index("assets_location_idx").on(table.locationId), categoryIdx: index("assets_category_idx").on(table.categoryId), serialIdx: index("assets_serial_idx").on(table.serialNumber), userTextIdx: index("assets_user_text_idx").on(table.userText), assignedIdx: index("assets_assigned_idx").on(table.assignedUserId) }));

export const assetSpecificationFields = mysqlTable("assetSpecificationFields", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId"),
  code: varchar("code", { length: 80 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  unit: varchar("unit", { length: 40 }),
  fieldType: mysqlEnum("fieldType", ["text", "number", "textarea"]).default("text").notNull(),
  required: int("required").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ categoryIdx: index("asset_spec_fields_category_idx").on(table.categoryId), activeIdx: index("asset_spec_fields_active_idx").on(table.active) }));

export const assetSpecificationValues = mysqlTable("assetSpecificationValues", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  fieldId: int("fieldId").notNull(),
  value: text("value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ assetIdx: index("asset_spec_values_asset_idx").on(table.assetId), fieldIdx: index("asset_spec_values_field_idx").on(table.fieldId) }));

export const inventoryWarehouses = mysqlTable("inventoryWarehouses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  note: text("note"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  itemCode: varchar("itemCode", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 240 }).notNull(),
  categoryId: int("categoryId"),
  locationId: int("locationId"),
  warehouseId: int("warehouseId"),
  unit: varchar("unit", { length: 40 }).default("cái").notNull(),
  quantity: int("quantity").default(0).notNull(),
  minimumQuantity: int("minimumQuantity").default(0).notNull(),
  note: text("note"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketCode: varchar("ticketCode", { length: 40 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  requesterId: int("requesterId"),
  departmentId: int("departmentId"),
  locationId: int("locationId"),
  assigneeId: int("assigneeId"),
  assetId: int("assetId"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["new", "in_progress", "waiting_user", "completed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ ticketStatusIdx: index("tickets_status_idx").on(table.status), ticketDepartmentIdx: index("tickets_department_idx").on(table.departmentId), ticketPriorityIdx: index("tickets_priority_idx").on(table.priority), ticketAssetIdx: index("tickets_asset_idx").on(table.assetId), ticketLocationIdx: index("tickets_location_idx").on(table.locationId) }));

export const ticketUpdates = mysqlTable("ticketUpdates", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  authorId: int("authorId"),
  status: mysqlEnum("status", ["new", "in_progress", "waiting_user", "completed"]).notNull(),
  note: text("note"),
  assetStatusAfter: mysqlEnum("assetStatusAfter", ["in_use", "available", "pending_allocation", "pending_return", "repair", "damaged", "retired"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ ticketIdx: index("ticket_updates_ticket_idx").on(table.ticketId) }));

export const handoverDocuments = mysqlTable("handoverDocuments", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  size: int("size").default(0).notNull(),
  storagePath: text("storagePath"),
  documentUrl: text("documentUrl"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const handoverRecords = mysqlTable("handoverRecords", {
  id: int("id").autoincrement().primaryKey(),
  documentCode: varchar("documentCode", { length: 80 }).notNull().unique(),
  assetId: int("assetId"),
  allocationId: int("allocationId"),
  ticketId: int("ticketId"),
  fromUserId: int("fromUserId"),
  toUserId: int("toUserId"),
  type: mysqlEnum("type", ["handover", "return"]).notNull(),
  documentUrl: text("documentUrl"),
  note: text("note"),
  happenedAt: timestamp("happenedAt").defaultNow().notNull(),
});

export const maintenanceRecords = mysqlTable("maintenanceRecords", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  requestedById: int("requestedById"),
  assignedToId: int("assignedToId"),
  ticketId: int("ticketId"),
  networkDeviceId: int("networkDeviceId"),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "cancelled"]).default("open").notNull(),
  issue: text("issue").notNull(),
  resolution: text("resolution"),
  costNote: varchar("costNote", { length: 160 }),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
}, table => ({ assetIdx: index("maintenance_asset_idx").on(table.assetId), ticketIdx: index("maintenance_ticket_idx").on(table.ticketId), statusIdx: index("maintenance_status_idx").on(table.status) }));

export const assetUsers = mysqlTable("assetUsers", {
  id: int("id").autoincrement().primaryKey(),
  employeeCode: varchar("employeeCode", { length: 60 }).notNull().unique(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  departmentId: int("departmentId"),
  position: varchar("position", { length: 160 }),
  role: mysqlEnum("role", ["operator", "manager", "viewer"]).default("operator").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const assetAllocations = mysqlTable("assetAllocations", {
  id: int("id").autoincrement().primaryKey(),
  allocationCode: varchar("allocationCode", { length: 80 }).notNull().unique(),
  assetId: int("assetId").notNull(),
  userId: int("userId"),
  userText: varchar("userText", { length: 180 }),
  departmentId: int("departmentId"),
  locationId: int("locationId"),
  warehouseId: int("warehouseId"),
  ticketId: int("ticketId"),
  allocatedAt: timestamp("allocatedAt").defaultNow().notNull(),
  returnedAt: timestamp("returnedAt"),
  status: mysqlEnum("status", ["pending_allocation", "active", "pending_return", "returned", "cancelled"]).default("pending_allocation").notNull(),
  note: text("note"),
});

export const allocationLicenses = mysqlTable("allocationLicenses", {
  id: int("id").autoincrement().primaryKey(),
  allocationId: int("allocationId").notNull(),
  licenseId: int("licenseId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ allocationIdx: index("allocation_licenses_allocation_idx").on(table.allocationId), licenseIdx: index("allocation_licenses_license_idx").on(table.licenseId) }));

export const attachmentFiles = mysqlTable("attachmentFiles", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }).notNull(),
  size: int("size").notNull(),
  storagePath: text("storagePath").notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  uploadedById: int("uploadedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 120 }).notNull().unique(),
  settingValue: text("settingValue"),
  description: varchar("description", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const systemUsers = mysqlTable("systemUsers", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  passwordHash: text("passwordHash").notNull(),
  role: mysqlEnum("role", ["administrator", "admin", "manager", "operator", "viewer"]).default("operator").notNull(),
  active: int("active").default(1).notNull(),
  mustChangePassword: int("mustChangePassword").default(1).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});



export const assetSpecificationFieldCategories = mysqlTable("assetSpecificationFieldCategories", {
  id: int("id").autoincrement().primaryKey(),
  fieldId: int("fieldId").notNull(),
  categoryId: int("categoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  fieldIdx: index("asfc_field_idx").on(table.fieldId),
  categoryIdx: index("asfc_category_idx").on(table.categoryId),
}));

export const systemUserSessions = mysqlTable("systemUserSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionTokenHash: varchar("sessionTokenHash", { length: 128 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  loginAt: timestamp("loginAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  logoutAt: timestamp("logoutAt"),
  active: int("active").default(1).notNull(),
}, table => ({
  userIdx: index("sus_user_idx").on(table.userId),
  lastSeenIdx: index("sus_last_seen_idx").on(table.lastSeenAt),
  activeIdx: index("sus_active_idx").on(table.active),
}));

export const systemActivityLogs = mysqlTable("systemActivityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: int("sessionId"),
  method: varchar("method", { length: 16 }),
  path: varchar("path", { length: 512 }).notNull(),
  page: varchar("page", { length: 160 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userIdx: index("sal_user_idx").on(table.userId),
  createdIdx: index("sal_created_idx").on(table.createdAt),
  pathIdx: index("sal_path_idx").on(table.path),
}));

export const inventoryChecks = mysqlTable("inventoryChecks", {
  id: int("id").autoincrement().primaryKey(),
  checkCode: varchar("checkCode", { length: 80 }).notNull().unique(),
  departmentId: int("departmentId"),
  locationId: int("locationId"),
  checkedById: int("checkedById"),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "cancelled"]).default("draft").notNull(),
  note: text("note"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const inventoryCheckItems = mysqlTable("inventoryCheckItems", {
  id: int("id").autoincrement().primaryKey(),
  inventoryCheckId: int("inventoryCheckId").notNull(),
  assetId: int("assetId").notNull(),
  expectedStatus: varchar("expectedStatus", { length: 40 }),
  actualStatus: varchar("actualStatus", { length: 40 }),
  found: int("found").default(0).notNull(),
  note: text("note"),
});

export const licenses = mysqlTable("licenses", {
  id: int("id").autoincrement().primaryKey(),
  licenseCode: varchar("licenseCode", { length: 80 }).notNull().unique(),
  productName: varchar("productName", { length: 240 }).notNull(),
  vendor: varchar("vendor", { length: 180 }),
  licenseType: varchar("licenseType", { length: 100 }),
  quantity: int("quantity").default(1).notNull(),
  usedQuantity: int("usedQuantity").default(0).notNull(),
  expiryDate: timestamp("expiryDate"),
  status: mysqlEnum("status", ["active", "expiring", "expired", "cancelled"]).default("active").notNull(),
  note: text("note"),
  warehouseId: int("warehouseId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const networkDevices = mysqlTable("networkDevices", {
  id: int("id").autoincrement().primaryKey(),
  deviceCode: varchar("deviceCode", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 240 }).notNull(),
  deviceType: varchar("deviceType", { length: 100 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  macAddress: varchar("macAddress", { length: 64 }),
  specifications: text("specifications"),
  locationId: int("locationId"),
  status: mysqlEnum("status", ["active", "maintenance", "offline", "retired"]).default("active").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reportTemplates = mysqlTable("reportTemplates", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 240 }).notNull(),
  departmentId: int("departmentId"),
  locationId: int("locationId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }).notNull(),
  storagePath: text("storagePath").notNull(),
  note: text("note"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const allocationTemplates = mysqlTable("allocationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["handover", "return"]).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  headerText: text("headerText"),
  bodyText: text("bodyText"),
  footerText: text("footerText"),
  active: int("active").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const systemGroups = mysqlTable("systemGroups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  description: text("description"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const systemUserGroups = mysqlTable("systemUserGroups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userIdx: index("sug_user_idx").on(table.userId),
  groupIdx: index("sug_group_idx").on(table.groupId),
}));

export const systemGroupPermissions = mysqlTable("systemGroupPermissions", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  module: varchar("module", { length: 80 }).notNull(),
  canView: int("canView").default(0).notNull(),
  canCreate: int("canCreate").default(0).notNull(),
  canEdit: int("canEdit").default(0).notNull(),
  canDelete: int("canDelete").default(0).notNull(),
}, table => ({
  groupIdx: index("sgp_group_idx").on(table.groupId),
  moduleIdx: index("sgp_module_idx").on(table.module),
}));

export const permissionRules = mysqlTable("permissionRules", {
  id: int("id").autoincrement().primaryKey(),
  role: varchar("role", { length: 60 }).notNull(),
  module: varchar("module", { length: 80 }).notNull(),
  canView: int("canView").default(0).notNull(),
  canCreate: int("canCreate").default(0).notNull(),
  canEdit: int("canEdit").default(0).notNull(),
  canDelete: int("canDelete").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
