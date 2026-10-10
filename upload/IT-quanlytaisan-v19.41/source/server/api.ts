import type { Express, Request, Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { desc, eq, and, or, like, sql } from "drizzle-orm";
import { getDb } from "./db";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookie } from "cookie";
const serializeCookie = (name:string, value:string, options:{httpOnly?:boolean;sameSite?:string;secure?:boolean;path?:string;maxAge?:number}) => `${name}=${encodeURIComponent(value)}; Path=${options.path||"/"}; HttpOnly; SameSite=${options.sameSite||"Lax"}; Max-Age=${options.maxAge??0}${options.secure?"; Secure":""}`;
import { assets, assetCategories, assetUsers, assetAllocations, attachmentFiles, departments, handoverRecords, handoverDocuments, locations, permissionRules, systemSettings, inventoryItems, maintenanceRecords, assetSpecificationFields, assetSpecificationValues, systemUsers, inventoryChecks, inventoryCheckItems, licenses, networkDevices, tickets, ticketUpdates, systemUserSessions, systemActivityLogs, reportTemplates, assetSpecificationFieldCategories, inventoryWarehouses, allocationTemplates, systemGroups, systemUserGroups, systemGroupPermissions, allocationLicenses } from "../drizzle/schema";

const uploadRoot = process.env.UPLOAD_DIR || "/var/lib/it-quanlytaisan/uploads";
const json = (res: Response, data: unknown, status = 200) => res.status(status).json(data);
const bad = (res: Response, message: string) => json(res, { message }, 400);
const appendAssetNote = (existing: unknown, addition: string) => {
  const base = String(existing || "").trim();
  const extra = String(addition || "").trim();
  if (!extra) return base || null;
  if (!base) return extra;
  if (base.includes(extra)) return base;
  return `${base}\n${extra}`;
};
const clientIp = (req: Request) => {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "";
};
const sessionHash = (token: string) => createHash("sha256").update(token).digest("hex");

const SESSION_COOKIE = "itq_session";
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || "CHANGE_THIS_JWT_SECRET_BEFORE_PRODUCTION");
const hashPassword = (password: string, salt?: string) => { const s = salt || randomUUID().replaceAll("-", ""); const h = scryptSync(password, s, 64).toString("hex"); return `scrypt:${s}:${h}`; };
const verifyPassword = (password: string, encoded: string) => { try { const [, salt, stored] = String(encoded).split(":"); const actual = scryptSync(password, salt, 64).toString("hex"); return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(stored, "hex")); } catch { return false; } };
const getSession = async (req: Request) => {
  try {
    const token = parseCookie(req.headers.cookie || "")[SESSION_COOKIE];
    if (!token) return null;
    const { payload } = await jwtVerify(token, jwtSecret);
    const db = await getDb();
    let sessionId: number | null = null;
    if (db) {
      const rows = await db.select({ id: systemUserSessions.id }).from(systemUserSessions).where(and(eq(systemUserSessions.sessionTokenHash, sessionHash(token)), eq(systemUserSessions.active, 1))).limit(1);
      sessionId = rows[0]?.id ? Number(rows[0].id) : null;
      if (sessionId) await db.update(systemUserSessions).set({ lastSeenAt: new Date() }).where(eq(systemUserSessions.id, sessionId));
    }
    return { id: Number(payload.sub), username: String(payload.username || ""), role: String(payload.role || "viewer"), sessionId };
  } catch { return null; }
};
const requirePermission = async (req: Request, res: Response, module: string, action: "canView" | "canCreate" | "canEdit" | "canDelete") => {
  const session = await getSession(req);
  if (!session) { json(res, { message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." }, 401); return null; }
  if (session.role === "administrator" || session.role === "admin") return session;
  const db = await getDb(); if (!db) { json(res, { message: "DATABASE_URL chưa được cấu hình" }, 500); return null; }
  try {
    const groupRows = await db.select({ groupId: systemUserGroups.groupId }).from(systemUserGroups).where(eq(systemUserGroups.userId, session.id));
    if (!groupRows.length) {
      json(res, { message: "Tài khoản chưa được gán nhóm quyền tùy chỉnh." }, 403);
      return null;
    }
    const groupIds = groupRows.map((x:any)=>Number(x.groupId)).filter(Boolean);
    const groupPerms = await db.select().from(systemGroupPermissions).where(or(...groupIds.map((id:number)=>eq(systemGroupPermissions.groupId,id)), eq(systemGroupPermissions.groupId, -1)));
    const granted = groupPerms.some((row:any)=>row.module===module && Number(row[action])===1);
    if (!granted) { json(res, { message: "Bạn không có quyền thực hiện thao tác này theo nhóm quyền tùy chỉnh." }, 403); return null; }
    return session;
  } catch (error) {
    console.error("Permission lookup failed", { module, action, error });
    json(res, { message: "Không thể kiểm tra phân quyền. Hãy kiểm tra cấu trúc database và quyền nhóm." }, 500);
    return null;
  }
};
const requireAnyPermission = async (req: Request, res: Response, modules: string[], action: "canView" | "canCreate" | "canEdit" | "canDelete") => {
  const session = await getSession(req);
  if (!session) { json(res, { message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." }, 401); return null; }
  if (session.role === "administrator" || session.role === "admin") return session;
  const db = await getDb(); if (!db) { json(res, { message: "DATABASE_URL chưa được cấu hình" }, 500); return null; }
  try {
    const groupRows = await db.select({ groupId: systemUserGroups.groupId }).from(systemUserGroups).where(eq(systemUserGroups.userId, session.id));
    if (!groupRows.length) { json(res, { message: "Tài khoản chưa được gán nhóm quyền tùy chỉnh." }, 403); return null; }
    const groupIds = groupRows.map((x:any)=>Number(x.groupId)).filter(Boolean);
    const groupPerms = await db.select().from(systemGroupPermissions).where(or(...groupIds.map((id:number)=>eq(systemGroupPermissions.groupId,id)), eq(systemGroupPermissions.groupId, -1)));
    const granted = groupPerms.some((row:any)=>modules.includes(String(row.module)) && Number(row[action])===1);
    if (!granted) { json(res, { message: "Bạn không có quyền xem dữ liệu của module này." }, 403); return null; }
    return session;
  } catch (error) { console.error("Permission lookup failed", { modules, action, error }); json(res, { message: "Không thể kiểm tra phân quyền." }, 500); return null; }
};
const requireAdminConsole = async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) { json(res, { message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." }, 401); return null; }
  if (session.role !== "administrator" && session.role !== "admin") { json(res, { message: "Chỉ tài khoản administrator hoặc admin mới được truy cập trang quản trị tài khoản." }, 403); return null; }
  return session;
};
const roleRank = (role:string) => ({administrator:100, admin:90, manager:60, operator:40, viewer:20} as Record<string,number>)[role] ?? 0;

const syncNetworkDeviceToAsset = async (db:any, networkId:number) => {
  const rows:any[] = await db.select().from(networkDevices).where(eq(networkDevices.id,networkId)).limit(1);
  const n=rows[0]; if(!n) return;
  // Hạ tầng & Mạng là một nguồn dữ liệu riêng, không còn tạo danh mục
  // "Hạ tầng & Mạng" trong bảng Loại tài sản. Các bản ghi đồng bộ NET-*
  // được giữ để tương thích dữ liệu lịch sử nhưng không gắn loại tài sản.
  const categoryId=null;
  const assetCode=`NET-${n.deviceCode}`;
  const statusMap:any={active:"available",maintenance:"repair",offline:"damaged",retired:"retired"};
  const noteParts=[n.note||"",n.ipAddress?`IP: ${n.ipAddress}`:""].filter(Boolean);
  const networkAssetStatus=statusMap[n.status]||"available"; const statusNote=n.status==="offline"?" Thiết bị offline - chuyển vào diện chờ thanh lý.":n.status==="retired"?" Thiết bị đã ngưng - đã thanh lý.":""; const values:any={assetCode,name:n.name,categoryId,locationId:n.locationId?Number(n.locationId):null,status:networkAssetStatus,specifications:n.specifications||null,note:[...noteParts,statusNote].filter(Boolean).join(" | ")||null};
  const existing:any[] = await db.select({id:assets.id}).from(assets).where(eq(assets.assetCode,assetCode)).limit(1);
  if(existing[0]) await db.update(assets).set(values).where(eq(assets.id,Number(existing[0].id)));
  else await db.insert(assets).values(values);
};

const consumeAllocationLicenses = async (db:any, allocationId:number, selections:any[]) => {
  const items = Array.isArray(selections) ? selections : [];
  for (const raw of items) {
    const licenseId = Number(raw?.licenseId || 0);
    const quantity = Math.max(1, Number(raw?.quantity || 1));
    if (!licenseId) continue;
    const licenseRows:any[] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
    const license = licenseRows[0];
    if (!license) throw new Error(`Không tìm thấy bản quyền #${licenseId}.`);
    if (["expired","cancelled"].includes(String(license.status))) throw new Error(`Bản quyền ${license.licenseCode} đã hết hạn hoặc đã hủy.`);
    const available = Math.max(Number(license.quantity || 0) - Number(license.usedQuantity || 0), 0);
    if (quantity > available) throw new Error(`Bản quyền ${license.licenseCode} chỉ còn ${available} chưa dùng.`);
    await db.update(licenses).set({ usedQuantity: Number(license.usedQuantity || 0) + quantity }).where(eq(licenses.id, licenseId));
    await db.insert(allocationLicenses).values({ allocationId, licenseId, quantity });
    await syncLicenseToSources(db, licenseId);
  }
};

const restoreAllocationLicenses = async (db:any, allocationId:number) => {
  const links:any[] = await db.select().from(allocationLicenses).where(eq(allocationLicenses.allocationId, allocationId));
  for (const link of links) {
    const licenseRows:any[] = await db.select().from(licenses).where(eq(licenses.id, Number(link.licenseId))).limit(1);
    const license = licenseRows[0];
    if (license) {
      await db.update(licenses).set({ usedQuantity: Math.max(0, Number(license.usedQuantity || 0) - Number(link.quantity || 0)) }).where(eq(licenses.id, Number(link.licenseId)));
      await syncLicenseToSources(db, Number(link.licenseId));
    }
  }
  return links;
};

const syncLicenseToSources = async (db:any, licenseId:number) => {
  const rows:any[] = await db.select().from(licenses).where(eq(licenses.id,licenseId)).limit(1);
  const l=rows[0]; if(!l) return;
  // Bản quyền & Dịch vụ là module nghiệp vụ riêng, không thuộc danh mục tài sản.
  const categoryId=null;
  const unused=Math.max(Number(l.quantity||0)-Number(l.usedQuantity||0),0);
  const warehouseId=l.warehouseId?Number(l.warehouseId):null;
  let warehouseName="Chưa xác định kho";
  if(warehouseId){const w=await db.select({name:inventoryWarehouses.name}).from(inventoryWarehouses).where(eq(inventoryWarehouses.id,warehouseId)).limit(1);warehouseName=w[0]?.name||warehouseName;}
  const expiry=l.expiryDate?new Date(l.expiryDate).toLocaleDateString("vi-VN"):"—";
  const note=[`Loại: ${l.licenseType||"—"}`,`Hết hạn: ${expiry}`,`Đã sử dụng: ${l.usedQuantity||0}`,`Chưa sử dụng: ${unused}`,`Lưu kho: ${warehouseName}`,l.note||""].filter(Boolean).join(" | ");
  const assetCode=`LIC-${l.licenseCode}`;
  const assetStatus=l.status==="expired"||l.status==="cancelled"?"retired":(unused>0?"available":"in_use");
  const av:any={assetCode,name:l.productName,categoryId,warehouseId, status:assetStatus,specifications:`Mã bản quyền: ${l.licenseCode} | Loại: ${l.licenseType||"—"} | Nhà cung cấp: ${l.vendor||"—"}`,note};
  const a:any[]=await db.select({id:assets.id}).from(assets).where(eq(assets.assetCode,assetCode)).limit(1);
  if(a[0]) await db.update(assets).set(av).where(eq(assets.id,Number(a[0].id))); else await db.insert(assets).values(av);
  const itemCode=`LIC-${l.licenseCode}`;
  const iv:any={itemCode,name:l.productName,categoryId,warehouseId,unit:"license",quantity:unused,minimumQuantity:0,note};
  const inv:any[]=await db.select({id:inventoryItems.id}).from(inventoryItems).where(eq(inventoryItems.itemCode,itemCode)).limit(1);
  if(inv[0]) await db.update(inventoryItems).set(iv).where(eq(inventoryItems.id,Number(inv[0].id))); else await db.insert(inventoryItems).values(iv);
};


async function validateSpecificationValues(db: any, categoryId: number | null, rawValues: any[]) {
  if (!categoryId) return null;
  const fields = await db.select().from(assetSpecificationFields).where(eq(assetSpecificationFields.active, 1));
  const links = await db.select().from(assetSpecificationFieldCategories).where(eq(assetSpecificationFieldCategories.categoryId, Number(categoryId)));
  const linkedIds = new Set(links.map((x:any)=>Number(x.fieldId)));
  const applicable = fields.filter((f: any) => { const code=String(f.code||"").toLowerCase(); if (!f.categoryId || /^(manufacturer|model|brand)(_|$)/.test(code)) return false; return Number(f.categoryId) === Number(categoryId) || linkedIds.has(Number(f.id)); });
  const values = new Map((Array.isArray(rawValues) ? rawValues : []).map((x: any) => [Number(x.fieldId), String(x.value ?? "").trim()]));
  const missing = applicable.filter((f: any) => f.required && !(values.get(Number(f.id)) || "")).map((f: any) => f.name);
  if (missing.length) return `Vui lòng nhập các thông số bắt buộc: ${missing.join(", ")}`;
  const invalidNumber = applicable.filter((f: any) => f.fieldType === "number" && (values.get(Number(f.id)) || "") && Number.isNaN(Number(values.get(Number(f.id))))).map((f: any) => f.name);
  if (invalidNumber.length) return `Thông số dạng số không hợp lệ: ${invalidNumber.join(", ")}`;
  return null;
}

export function registerAssetApi(app: Express) {
  app.post("/api/auth/login", async (req, res) => {
    const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình");
    const username = String(req.body?.username || "").trim(); const password = String(req.body?.password || "");
    const rows = await db.select().from(systemUsers).where(eq(systemUsers.username, username)).limit(1);
    const user = rows[0];
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) return json(res, { message: "Tên đăng nhập hoặc mật khẩu không đúng." }, 401);
    const token = await new SignJWT({ username: user.username, role: user.role, sid: randomUUID() }).setProtectedHeader({ alg: "HS256" }).setSubject(String(user.id)).setIssuedAt().setExpirationTime("12h").sign(jwtSecret);
    const ip = clientIp(req);
    const ua = String(req.headers["user-agent"] || "").slice(0,512);
    await db.update(systemUsers).set({ lastLoginAt: new Date() }).where(eq(systemUsers.id, user.id));
    await db.insert(systemUserSessions).values({ userId:user.id, sessionTokenHash:sessionHash(token), ipAddress:ip, userAgent:ua, active:1 });
    res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 60 * 60 * 12 }));
    return json(res, { id: user.id, username: user.username, fullName: user.fullName, role: user.role, mustChangePassword: Boolean(user.mustChangePassword) });
  });
  app.get("/api/auth/me", async (req, res) => {
    const session = await getSession(req); if (!session) return json(res, null, 401);
    const db = await getDb(); if (!db) return json(res, null, 500);
    const rows = await db.select({ id: systemUsers.id, username: systemUsers.username, fullName: systemUsers.fullName, role: systemUsers.role, active: systemUsers.active, mustChangePassword: systemUsers.mustChangePassword }).from(systemUsers).where(eq(systemUsers.id, session.id)).limit(1);
    if (!rows[0] || !rows[0].active) return json(res, null, 401); return json(res, rows[0]);
  });
  app.post("/api/auth/logout", async (req, res) => {
    const token = parseCookie(req.headers.cookie || "")[SESSION_COOKIE];
    const db = await getDb();
    if (db && token) await db.update(systemUserSessions).set({active:0,logoutAt:new Date(),lastSeenAt:new Date()}).where(eq(systemUserSessions.sessionTokenHash,sessionHash(token)));
    res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 0 }));
    return json(res, { ok: true });
  });
  app.post("/api/system/activity/page", async (req,res)=>{
    try {
      const session=await getSession(req); if(!session) return json(res,{message:"Phiên đăng nhập không hợp lệ hoặc đã hết hạn."},401);
      const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
      await db.insert(systemActivityLogs).values({userId:session.id,sessionId:session.sessionId,method:"PAGE",path:String(req.body?.path||"/").slice(0,512),page:String(req.body?.page||"").slice(0,160),ipAddress:clientIp(req),userAgent:String(req.headers["user-agent"]||"").slice(0,512)});
      return json(res,{ok:true});
    } catch(error) {
      // Activity logging must never be allowed to terminate the Express process.
      console.error("Activity page log failed", error);
      return json(res,{ok:false,loggingUnavailable:true},503);
    }
  });
  app.get("/api/system/activity/overview", async (req,res)=>{
    if(!(await requirePermission(req,res,"settings","canView"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const usersRows=await db.select({id:systemUsers.id,username:systemUsers.username,fullName:systemUsers.fullName,role:systemUsers.role,active:systemUsers.active}).from(systemUsers).orderBy(systemUsers.username);
      const sessions=await db.select().from(systemUserSessions).orderBy(desc(systemUserSessions.lastSeenAt));
      const logs=await db.select().from(systemActivityLogs).orderBy(desc(systemActivityLogs.createdAt)).limit(300);
      const now=Date.now();
      const latest=new Map<number,any>();
      for(const x of logs){const uid=Number(x.userId||0);if(uid&&!latest.has(uid))latest.set(uid,x);}
      const latestSession=new Map<number,any>();
      for(const x of sessions){const uid=Number(x.userId||0);if(uid&&!latestSession.has(uid))latestSession.set(uid,x);}
      const users=usersRows.map((u:any)=>{
        const a=latest.get(Number(u.id)); const se=latestSession.get(Number(u.id));
        const lastAt=a?.createdAt||se?.lastSeenAt||null; const age=lastAt?Math.max(0,now-new Date(lastAt).getTime()):null;
        return {...u,online:Boolean(age!==null&&age<5*60*1000&&se?.active),lastSeenAt:lastAt,offlineMinutes:age===null?null:Math.floor(age/60000),ipAddress:a?.ipAddress||se?.ipAddress||null};
      });
      const count=(ms:number)=>users.filter((u:any)=>u.lastSeenAt&&now-new Date(u.lastSeenAt).getTime()<=ms).length;
      return json(res,{users,summary:{online:users.filter((u:any)=>u.online).length,last1h:count(3600000),last24h:count(86400000),last7d:count(604800000)},logs});
    } catch(error){console.error("Activity overview failed",error);return json(res,{message:"Không thể tải nhật ký người dùng."},500);}
  });
  app.get("/api/system/activity/logs", async (req,res)=>{
    if(!(await requirePermission(req,res,"settings","canView"))) return;
    const db=await getDb(); if(!db)return json(res,[]);
    try {
      const limit=Math.min(500,Math.max(20,Number(req.query.limit||200)));
      return json(res,await db.select().from(systemActivityLogs).orderBy(desc(systemActivityLogs.createdAt)).limit(limit));
    } catch(error) {
      console.error("Activity logs read failed", error);
      return json(res,{message:"Không thể đọc nhật ký truy cập. Hãy chạy pnpm db:upgrade."},503);
    }
  });
  app.get("/api/admin/users", async (req,res)=>{ const session=await requireAdminConsole(req,res); if(!session)return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const rows=await db.select({id:systemUsers.id,username:systemUsers.username,fullName:systemUsers.fullName,role:systemUsers.role,active:systemUsers.active,mustChangePassword:systemUsers.mustChangePassword,lastLoginAt:systemUsers.lastLoginAt}).from(systemUsers).orderBy(systemUsers.username); const memberships=await db.select().from(systemUserGroups); const groups=await db.select().from(systemGroups); const gm=new Map(groups.map((g:any)=>[Number(g.id),g])); return json(res,rows.map((u:any)=>({...u,groups:memberships.filter((m:any)=>Number(m.userId)===Number(u.id)).map((m:any)=>gm.get(Number(m.groupId))).filter(Boolean)}))); } catch(error){console.error("Admin users read failed",error);return json(res,{message:"Không thể tải tài khoản quản trị."},500);} });
  app.post("/api/admin/users", async (req,res)=>{ const session=await requireAdminConsole(req,res); if(!session)return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const b=req.body||{}; const role=String(b.role||"operator"); if(!["administrator","admin","manager","operator","viewer"].includes(role))return bad(res,"Vai trò không hợp lệ."); if(roleRank(role)>=roleRank(session.role)&&session.role!=="administrator")return json(res,{message:"Tài khoản admin chỉ được tạo vai trò thấp hơn chính mình."},403); if(!b.username||!b.fullName||!b.password)return bad(res,"Tên đăng nhập, họ tên và mật khẩu là bắt buộc"); if(String(b.password).length<10)return bad(res,"Mật khẩu phải có ít nhất 10 ký tự."); const r:any=await db.insert(systemUsers).values({username:String(b.username).trim(),fullName:String(b.fullName).trim(),passwordHash:hashPassword(String(b.password)),role:role as any,active:b.active===0?0:1,mustChangePassword:1}); const id=Number(r.insertId||0); if(id&&Array.isArray(b.groupIds)){for(const gid of b.groupIds.map(Number).filter(Boolean))await db.insert(systemUserGroups).values({userId:id,groupId:gid});} return json(res,{ok:true,id},201); } catch(error){console.error("Admin user create failed",error);return json(res,{message:"Không thể tạo tài khoản quản trị. Có thể tên đăng nhập đã tồn tại."},500);} });
  app.patch("/api/admin/users/:id", async (req,res)=>{ const session=await requireAdminConsole(req,res); if(!session)return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const id=Number(req.params.id); const targetRows=await db.select().from(systemUsers).where(eq(systemUsers.id,id)).limit(1); if(!targetRows[0])return json(res,{message:"Không tìm thấy tài khoản."},404); if(id!==session.id && roleRank(String(targetRows[0].role))>=roleRank(session.role) && session.role!=="administrator")return json(res,{message:"Không thể chỉnh sửa tài khoản có vai trò ngang hoặc cao hơn."},403); const b={...req.body}; delete b.username; const nextRole=b.role?String(b.role):String(targetRows[0].role); if(!["administrator","admin","manager","operator","viewer"].includes(nextRole))return bad(res,"Vai trò không hợp lệ."); if(roleRank(nextRole)>roleRank(session.role) && session.role!=="administrator")return json(res,{message:"Không thể nâng vai trò vượt quyền tài khoản hiện tại."},403); if(b.password){if(String(b.password).length<10)return bad(res,"Mật khẩu phải có ít nhất 10 ký tự.");b.passwordHash=hashPassword(String(b.password));b.mustChangePassword=1;delete b.password;} delete b.groupIds; await db.update(systemUsers).set(b).where(eq(systemUsers.id,id)); if(Array.isArray(req.body.groupIds)){await db.delete(systemUserGroups).where(eq(systemUserGroups.userId,id));for(const gid of req.body.groupIds.map(Number).filter(Boolean))await db.insert(systemUserGroups).values({userId:id,groupId:gid});} return json(res,{ok:true}); } catch(error){console.error("Admin user update failed",error);return json(res,{message:"Không thể cập nhật tài khoản."},500);} });
  app.delete("/api/admin/users/:id", async (req,res)=>{ const session=await requireAdminConsole(req,res); if(!session)return; const id=Number(req.params.id); if(id===session.id)return bad(res,"Không thể tự xóa tài khoản đang đăng nhập."); const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const target=await db.select({role:systemUsers.role}).from(systemUsers).where(eq(systemUsers.id,id)).limit(1); if(!target[0])return json(res,{message:"Không tìm thấy tài khoản."},404); if(roleRank(String(target[0].role))>=roleRank(session.role) && session.role!=="administrator")return json(res,{message:"Không thể xóa tài khoản có vai trò ngang hoặc cao hơn."},403); await db.delete(systemUserGroups).where(eq(systemUserGroups.userId,id)); await db.delete(systemUsers).where(eq(systemUsers.id,id)); return json(res,{ok:true}); });
  app.get("/api/admin/groups", async (req,res)=>{const session=await requireAdminConsole(req,res);if(!session)return;const db=await getDb();if(!db)return json(res,[]);const [groups,members]=await Promise.all([db.select().from(systemGroups).orderBy(systemGroups.name),db.select().from(systemUserGroups)]);return json(res,groups.map((g:any)=>({...g,memberCount:members.filter((m:any)=>Number(m.groupId)===Number(g.id)).length,userIds:members.filter((m:any)=>Number(m.groupId)===Number(g.id)).map((m:any)=>Number(m.userId))})));});
  app.post("/api/admin/groups", async (req,res)=>{const session=await requireAdminConsole(req,res);if(!session)return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");const name=String(req.body?.name||"").trim();if(!name)return bad(res,"Tên nhóm là bắt buộc.");try{const r:any=await db.insert(systemGroups).values({name,description:req.body?.description||null,active:req.body?.active===0?0:1});return json(res,{ok:true,id:Number(r.insertId||0)},201)}catch(error){return json(res,{message:"Không thể tạo nhóm. Có thể tên nhóm đã tồn tại."},409)}});
  app.patch("/api/admin/groups/:id", async (req,res)=>{const session=await requireAdminConsole(req,res);if(!session)return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");const b={name:req.body?.name,description:req.body?.description,active:req.body?.active===undefined?undefined:Number(req.body.active)?1:0};Object.keys(b).forEach(k=>b[k]===undefined&&delete b[k]);await db.update(systemGroups).set(b).where(eq(systemGroups.id,Number(req.params.id)));return json(res,{ok:true})});
  app.delete("/api/admin/groups/:id", async (req,res)=>{const session=await requireAdminConsole(req,res);if(!session)return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");const gid=Number(req.params.id);await db.delete(systemUserGroups).where(eq(systemUserGroups.groupId,gid));await db.delete(systemGroupPermissions).where(eq(systemGroupPermissions.groupId,gid));await db.delete(systemGroups).where(eq(systemGroups.id,gid));return json(res,{ok:true})});
  app.get("/api/admin/permissions", async (req,res)=>{const session=await requireAdminConsole(req,res);if(!session)return;const db=await getDb();if(!db)return json(res,[]);const [roles,groups]=await Promise.all([db.select().from(permissionRules).orderBy(permissionRules.role,permissionRules.module),db.select().from(systemGroupPermissions)]);return json(res,{roles,groups});});
  app.patch("/api/admin/permissions/role/:role/:module", async (req,res)=>{
    const session=await requireAdminConsole(req,res); if(!session)return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    const role=decodeURIComponent(String(req.params.role)), module=decodeURIComponent(String(req.params.module));
    const allowedRoles=["administrator","admin","manager","operator","viewer"];
    if(!allowedRoles.includes(role))return bad(res,"Vai trò không hợp lệ.");
    if(role==="administrator"&&session.role!=="administrator")return json(res,{message:"Chỉ administrator mới được thay đổi quyền administrator."},403);
    if(role!=="administrator"&&session.role!=="administrator"){
      const rank=(x:string)=>({viewer:20,operator:40,manager:60,admin:90,administrator:100}[x]??-1);
      if(rank(role)>=rank(String(session.role)))return json(res,{message:"Không thể thay đổi quyền của vai trò ngang hoặc cao hơn tài khoản hiện tại."},403);
    }
    const existing=await db.select().from(permissionRules).where(and(eq(permissionRules.role,role),eq(permissionRules.module,module)));
    const current=existing[0]||{canView:0,canCreate:0,canEdit:0,canDelete:0};
    const actionValues={canView:req.body?.canView===undefined?Number(current.canView)?1:0:Number(req.body?.canView)?1:0,canCreate:req.body?.canCreate===undefined?Number(current.canCreate)?1:0:Number(req.body?.canCreate)?1:0,canEdit:req.body?.canEdit===undefined?Number(current.canEdit)?1:0:Number(req.body?.canEdit)?1:0,canDelete:req.body?.canDelete===undefined?Number(current.canDelete)?1:0:Number(req.body?.canDelete)?1:0};
    if(existing.length){
      await db.update(permissionRules).set(actionValues).where(and(eq(permissionRules.role,role),eq(permissionRules.module,module)));
      const latest=await db.select().from(permissionRules).where(and(eq(permissionRules.role,role),eq(permissionRules.module,module))).limit(1);
      return json(res,{ok:true,permission:latest[0]});
    }
    const inserted=await db.insert(permissionRules).values({role,module,...actionValues});
    const id=Number((inserted as any).insertId||0);
    const latest=id?await db.select().from(permissionRules).where(eq(permissionRules.id,id)).limit(1):await db.select().from(permissionRules).where(and(eq(permissionRules.role,role),eq(permissionRules.module,module))).limit(1);
    return json(res,{ok:true,permission:latest[0]});
  });
  app.patch("/api/admin/permissions/group/:groupId/:module", async (req,res)=>{
    const session=await requireAdminConsole(req,res); if(!session)return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    const groupId=Number(req.params.groupId),module=decodeURIComponent(String(req.params.module));
    if(!Number.isFinite(groupId)||groupId<=0)return bad(res,"Nhóm không hợp lệ.");
    const existing=await db.select().from(systemGroupPermissions).where(and(eq(systemGroupPermissions.groupId,groupId),eq(systemGroupPermissions.module,module)));
    const current=existing[0]||{canView:0,canCreate:0,canEdit:0,canDelete:0};
    const body={canView:req.body?.canView===undefined?Number(current.canView)?1:0:Number(req.body?.canView)?1:0,canCreate:req.body?.canCreate===undefined?Number(current.canCreate)?1:0:Number(req.body?.canCreate)?1:0,canEdit:req.body?.canEdit===undefined?Number(current.canEdit)?1:0:Number(req.body?.canEdit)?1:0,canDelete:req.body?.canDelete===undefined?Number(current.canDelete)?1:0:Number(req.body?.canDelete)?1:0};
    if(existing.length){
      await db.update(systemGroupPermissions).set(body).where(and(eq(systemGroupPermissions.groupId,groupId),eq(systemGroupPermissions.module,module)));
      const latest=await db.select().from(systemGroupPermissions).where(and(eq(systemGroupPermissions.groupId,groupId),eq(systemGroupPermissions.module,module))).limit(1);
      return json(res,{ok:true,permission:latest[0]});
    }
    const inserted=await db.insert(systemGroupPermissions).values({groupId,module,...body});
    const id=Number((inserted as any).insertId||0);
    const latest=id?await db.select().from(systemGroupPermissions).where(eq(systemGroupPermissions.id,id)).limit(1):await db.select().from(systemGroupPermissions).where(and(eq(systemGroupPermissions.groupId,groupId),eq(systemGroupPermissions.module,module))).limit(1);
    return json(res,{ok:true,permission:latest[0]});
  });

  app.get("/api/auth/users", async (req,res)=>{ if(!(await requirePermission(req,res,"settings","canView"))) return; const db=await getDb(); if(!db)return json(res,[]); try{return json(res,await db.select({id:systemUsers.id,username:systemUsers.username,fullName:systemUsers.fullName,role:systemUsers.role,active:systemUsers.active,mustChangePassword:systemUsers.mustChangePassword,lastLoginAt:systemUsers.lastLoginAt}).from(systemUsers).orderBy(systemUsers.username));}catch(error){console.error("System users read failed",error);return json(res,{message:"Không thể đọc bảng systemUsers. Hãy chạy cập nhật database v9."},500);} });
  app.post("/api/auth/users", async (req,res)=>{ if(!(await requirePermission(req,res,"settings","canCreate"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const b=req.body||{}; if(!b.username||!b.fullName||!b.password)return bad(res,"Tên đăng nhập, họ tên và mật khẩu là bắt buộc"); if(String(b.password).length<10)return bad(res,"Mật khẩu phải có ít nhất 10 ký tự."); await db.insert(systemUsers).values({username:String(b.username).trim(),fullName:String(b.fullName).trim(),passwordHash:hashPassword(String(b.password)),role:b.role||"operator",active:b.active===0?0:1,mustChangePassword:1}); return json(res,{ok:true},201); });
  app.patch("/api/auth/users/:id", async (req,res)=>{ if(!(await requirePermission(req,res,"settings","canEdit"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const b={...req.body}; delete b.username; if(b.password){ if(String(b.password).length<10)return bad(res,"Mật khẩu phải có ít nhất 10 ký tự."); b.passwordHash=hashPassword(String(b.password)); b.mustChangePassword=1; delete b.password; } await db.update(systemUsers).set(b).where(eq(systemUsers.id,Number(req.params.id))); return json(res,{ok:true}); });
  app.delete("/api/auth/users/:id", async (req,res)=>{ const session=await requirePermission(req,res,"settings","canDelete"); if(!session)return; if(session.id===Number(req.params.id))return bad(res,"Không thể tự xóa tài khoản đang đăng nhập."); const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); await db.delete(systemUsers).where(eq(systemUsers.id,Number(req.params.id))); return json(res,{ok:true}); });
  app.post("/api/auth/change-password", async (req, res) => {
    const session = await getSession(req); if (!session) return json(res, { message: "Chưa đăng nhập." }, 401);
    const current = String(req.body?.currentPassword || ""); const next = String(req.body?.newPassword || ""); if (next.length < 10) return bad(res, "Mật khẩu mới phải có ít nhất 10 ký tự.");
    const db = await getDb(); if (!db) return json(res, { message: "DATABASE_URL chưa được cấu hình" }, 500); const rows = await db.select().from(systemUsers).where(eq(systemUsers.id, session.id)).limit(1); if (!rows[0] || !verifyPassword(current, rows[0].passwordHash)) return json(res, { message: "Mật khẩu hiện tại không đúng." }, 400);
    await db.update(systemUsers).set({ passwordHash: hashPassword(next), mustChangePassword: 0 }).where(eq(systemUsers.id, session.id)); return json(res, { ok: true });
  });

  app.get("/api/asset/meta", async (_req, res) => {
    const db = await getDb();
    if (!db) return json(res, { departments: [], locations: [], categories: [], users: [] });
    const [departmentRows, locationRows, categoryRows, userRows, warehouseRows] = await Promise.all([
      db.select().from(departments), db.select().from(locations), db.select().from(assetCategories), db.select().from(assetUsers).orderBy(assetUsers.fullName), db.select().from(inventoryWarehouses).where(eq(inventoryWarehouses.active, 1)).orderBy(inventoryWarehouses.name),
    ]);
    const filteredCategories = categoryRows.filter((x:any)=>{const n=String(x.name||"").trim().toLowerCase();return n!=="hạ tầng & mạng" && n!=="bản quyền & dịch vụ";});
    return json(res, { departments: departmentRows, locations: locationRows, categories: filteredCategories, users: userRows, warehouses: warehouseRows });
  });

  app.get("/api/asset/specification-fields", async (req, res) => {
    const db = await getDb(); if (!db) return json(res, []);
    try {
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
      if (!categoryId) return json(res, []);
      const cats = await db.select().from(assetCategories).where(eq(assetCategories.id, categoryId)).limit(1);
      if (!cats[0]) return json(res, []);
      const categoryName = String(cats[0].name || "").trim().toLowerCase();
      if (["hạ tầng & mạng", "bản quyền & dịch vụ"].includes(categoryName)) return json(res, []);
      const rows = await db.select().from(assetSpecificationFields).where(eq(assetSpecificationFields.active, 1));
      const links = await db.select().from(assetSpecificationFieldCategories).where(eq(assetSpecificationFieldCategories.categoryId, categoryId));
      const linkedIds = new Set(links.map((x:any)=>Number(x.fieldId)));
      const applicable = rows.filter((x: any) => { const code=String(x.code||"").toLowerCase(); if (/^(manufacturer|model|brand)(_|$)/.test(code)) return false; return Number(x.categoryId) === categoryId || linkedIds.has(Number(x.id)); });
      const seen=new Set<string>(); const deduped=applicable.filter((x:any)=>{const key=String(x.name||"").trim().toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});
      return json(res, deduped.sort((a: any, b: any) => Number(a.sortOrder) - Number(b.sortOrder)));
    } catch (error) {
      console.error("Specification fields read failed", error);
      return json(res,{message:"Không thể tải thông số kỹ thuật. Hãy chạy pnpm db:upgrade rồi thử lại."},503);
    }
  });

  // Quản trị cấu hình thông số kỹ thuật: xem toàn bộ trường, kể cả trường đang tắt.
  app.get("/api/asset/specification-fields/admin", async (req, res) => {
    if(!(await requireAdminConsole(req,res))) return;
    const db = await getDb(); if (!db) return json(res, []);
    try {
      const rows:any[] = await db.select().from(assetSpecificationFields).where(sql`categoryId IS NOT NULL AND LOWER(code) NOT REGEXP '^(manufacturer|model|brand)(_|$)'`).orderBy(assetSpecificationFields.sortOrder, assetSpecificationFields.id);
      let links:any[] = [];
      try {
        links = await db.select().from(assetSpecificationFieldCategories);
      } catch (linkError) {
        // Older production databases may not have the multi-category link table yet.
        // Keep Hệ thống usable and fall back to the legacy categoryId column.
        console.warn("Specification category-link table unavailable; using legacy categoryId", linkError);
      }
      const byField=new Map<number,number[]>();
      for(const link of links){const id=Number(link.fieldId);if(!byField.has(id))byField.set(id,[]);byField.get(id)!.push(Number(link.categoryId));}
      return json(res, rows.map(x=>({...x,categoryIds:byField.get(Number(x.id)) || (x.categoryId!=null?[Number(x.categoryId)]:[])})));
    } catch(error) {
      console.error("Specification admin read failed", error);
      return json(res,{message:"Không thể đọc cấu hình thông số kỹ thuật. Hãy chạy pnpm db:upgrade để đồng bộ database."},500);
    }
  });
  app.post("/api/asset/specification-fields", async (req, res) => {
    if(!(await requireAdminConsole(req,res))) return;
    const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình");
    const b = req.body || {};
    if (!b.name) return bad(res, "Tên thông số kỹ thuật là bắt buộc");
    const baseCode = String(b.code || b.name).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
    const categoryIds: number[] = Array.isArray(b.categoryIds) ? Array.from(new Set<number>(b.categoryIds.map((x:any)=>Number(x)).filter(Boolean))) : (b.categoryId ? [Number(b.categoryId)] : []);
    if (!categoryIds.length) return bad(res, "Thông số kỹ thuật phải gắn với ít nhất một loại tài sản.");
    const validCategories:any[] = await db.select().from(assetCategories).where(or(...categoryIds.map((categoryId:number)=>eq(assetCategories.id,categoryId))));
    if (validCategories.length !== categoryIds.length || validCategories.some((c:any)=>["hạ tầng & mạng","bản quyền & dịch vụ"].includes(String(c.name||"").trim().toLowerCase()))) return bad(res, "Thông số kỹ thuật chỉ được gắn với loại tài sản đang quản lý trong Danh mục.");
    const scopedBase = `${baseCode || "spec"}${categoryIds.length===1 ? `_${categoryIds[0]}` : ""}`.slice(0, 72);
    let code = scopedBase || "spec";
    let suffix = 2;
    while ((await db.select({ id: assetSpecificationFields.id }).from(assetSpecificationFields).where(eq(assetSpecificationFields.code, code)).limit(1)).length) {
      code = `${scopedBase || "spec"}_${suffix++}`.slice(0, 80);
    }
    const primaryCategoryId = categoryIds[0];
    const result:any = await db.insert(assetSpecificationFields).values({ categoryId: primaryCategoryId, code, name: String(b.name).trim(), unit: b.unit ? String(b.unit).trim() : null, fieldType: ["text", "number", "textarea"].includes(String(b.fieldType)) ? b.fieldType : "text", required: b.required ? 1 : 0, sortOrder: Number(b.sortOrder || 0), active: b.active === 0 ? 0 : 1 });
    const fieldId = Number(result.insertId || 0);
    if (fieldId && categoryIds.length > 1) await db.insert(assetSpecificationFieldCategories).values(categoryIds.map((categoryId:number)=>({fieldId, categoryId})));
    return json(res, { ok: true, id: fieldId }, 201);
  });
  app.patch("/api/asset/specification-fields/:id", async (req, res) => {
    if(!(await requireAdminConsole(req,res))) return;
    const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình");
    const id = Number(req.params.id);
    const body:any = { ...req.body };
    const categoryIds: number[] = Array.isArray(body.categoryIds) ? Array.from(new Set<number>(body.categoryIds.map((x:any)=>Number(x)).filter(Boolean))) : (body.categoryId ? [Number(body.categoryId)] : []);
    delete body.categoryIds;
    if (body.categoryId !== undefined || Array.isArray(req.body?.categoryIds)) { if (!categoryIds.length) return bad(res, "Thông số kỹ thuật phải gắn với ít nhất một loại tài sản."); const validCategories:any[]=await db.select().from(assetCategories).where(or(...categoryIds.map((categoryId:number)=>eq(assetCategories.id,categoryId)))); if(validCategories.length!==categoryIds.length||validCategories.some((c:any)=>["hạ tầng & mạng","bản quyền & dịch vụ"].includes(String(c.name||"").trim().toLowerCase()))) return bad(res,"Thông số kỹ thuật chỉ được gắn với loại tài sản đang quản lý trong Danh mục."); body.categoryId = categoryIds[0]; }
    if (body.required !== undefined) body.required = body.required ? 1 : 0;
    if (body.active !== undefined) body.active = body.active ? 1 : 0;
    if (body.sortOrder !== undefined) body.sortOrder = Number(body.sortOrder || 0);
    if (body.name !== undefined) body.name = String(body.name).trim();
    if (body.unit !== undefined) body.unit = body.unit ? String(body.unit).trim() : null;
    delete body.code;
    await db.update(assetSpecificationFields).set(body).where(eq(assetSpecificationFields.id, id));
    if (Array.isArray(req.body?.categoryIds)) {
      await db.delete(assetSpecificationFieldCategories).where(eq(assetSpecificationFieldCategories.fieldId, id));
      const categoryIds2: number[] = Array.from(new Set<number>(req.body.categoryIds.map((x:any)=>Number(x)).filter(Boolean)));
      if (categoryIds2.length) await db.insert(assetSpecificationFieldCategories).values(categoryIds2.map((categoryId:number)=>({fieldId:id,categoryId})));
    }
    return json(res, { ok: true });
  });
  app.post("/api/asset/specification-fields/:id/copy", async (req,res)=>{
    if (!(await requireAdminConsole(req,res))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    const source=await db.select().from(assetSpecificationFields).where(eq(assetSpecificationFields.id,Number(req.params.id))).limit(1);
    if(!source[0]) return json(res,{message:"Không tìm thấy thông số cần sao chép."},404);
    const b=req.body||{}; const categoryIds: number[]=Array.from(new Set<number>((Array.isArray(b.categoryIds)?b.categoryIds:[]).map((x:any)=>Number(x)).filter(Boolean)));
    if(!categoryIds.length)return bad(res,"Thông số kỹ thuật phải gắn với ít nhất một loại tài sản.");
    const validCategories:any[]=await db.select().from(assetCategories).where(or(...categoryIds.map((categoryId:number)=>eq(assetCategories.id,categoryId))));
    if(validCategories.length!==categoryIds.length||validCategories.some((c:any)=>["hạ tầng & mạng","bản quyền & dịch vụ"].includes(String(c.name||"").trim().toLowerCase())))return bad(res,"Thông số kỹ thuật chỉ được gắn với loại tài sản đang quản lý trong Danh mục.");
    const base=String(b.name||`${source[0].name} - Bản sao`).trim();
    let code=String(source[0].code||"spec").slice(0,60)+"_copy"; let n=2;
    while((await db.select({id:assetSpecificationFields.id}).from(assetSpecificationFields).where(eq(assetSpecificationFields.code,code)).limit(1)).length) code=`${String(source[0].code||"spec").slice(0,60)}_copy_${n++}`.slice(0,80);
    const r:any=await db.insert(assetSpecificationFields).values({categoryId:categoryIds[0],code,name:base,unit:source[0].unit||null,fieldType:source[0].fieldType,required:source[0].required,sortOrder:source[0].sortOrder,active:1});
    const fieldId=Number(r.insertId||0);
    if(fieldId&&categoryIds.length) await db.insert(assetSpecificationFieldCategories).values(categoryIds.map((categoryId:number)=>({fieldId,categoryId})));
    return json(res,{ok:true,id:fieldId},201);
  });
  app.delete("/api/asset/specification-fields/:id", async (req, res) => {
    if (!(await requireAdminConsole(req, res))) return;
    const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình");
    const id = Number(req.params.id);
    const used = await db.select({ id: assetSpecificationValues.id }).from(assetSpecificationValues).where(eq(assetSpecificationValues.fieldId, id)).limit(1);
    if (used.length) return bad(res, "Thông số đã có dữ liệu tài sản; hãy tắt trường thay vì xóa.");
    await db.delete(assetSpecificationFieldCategories).where(eq(assetSpecificationFieldCategories.fieldId,id));
    await db.delete(assetSpecificationFields).where(eq(assetSpecificationFields.id, id));
    return json(res, { ok: true });
  });
  app.get("/api/asset/assets", async (req, res) => {
    if (!(await requirePermission(req,res,"assets","canView"))) return;
    const db = await getDb(); if (!db) return json(res, []);
    try {
      const q = String(req.query.q || "").trim();
      const departmentId = req.query.departmentId ? Number(req.query.departmentId) : null;
      const locationId = req.query.locationId ? Number(req.query.locationId) : null;
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
      const status = String(req.query.status || "").trim();
      const user = String(req.query.user || "").trim();
      const conditions:any[] = [];
      if (departmentId) conditions.push(eq(assets.departmentId, departmentId));
      if (locationId) conditions.push(eq(assets.locationId, locationId));
      if (categoryId) conditions.push(eq(assets.categoryId, categoryId));
      if (status) conditions.push(eq(assets.status, status as any));
      if (user) conditions.push(like(assets.userText, `%${user}%`));
      if (q) conditions.push(or(like(assets.name, `%${q}%`), like(assets.assetCode, `%${q}%`), like(assets.serialNumber, `%${q}%`), like(assets.userText, `%${q}%`)));
      const rows = await db.select().from(assets).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(assets.id));
      const values = await db.select().from(assetSpecificationValues);
      return json(res, rows.map((asset: any) => ({ ...asset, specificationValues: values.filter((v: any) => Number(v.assetId) === Number(asset.id)) })));
    } catch (error) { console.error("Asset list query failed", error); return json(res, { message: "Không thể tải danh sách tài sản." }, 500); }
  });
  app.get("/api/asset/assets/:id", async (req, res) => {
    if (!(await requirePermission(req,res,"assets","canView"))) return;
    const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình");
    try {
      const id = Number(req.params.id);
      const rows:any[] = await db.select().from(assets).where(eq(assets.id,id)).limit(1);
      if (!rows[0]) return json(res,{message:"Không tìm thấy tài sản."},404);
      const [values, fields, files] = await Promise.all([
        db.select().from(assetSpecificationValues).where(eq(assetSpecificationValues.assetId,id)),
        db.select().from(assetSpecificationFields).where(eq(assetSpecificationFields.active,1)),
        db.select({id:attachmentFiles.id,fileName:attachmentFiles.fileName,mimeType:attachmentFiles.mimeType,size:attachmentFiles.size,createdAt:attachmentFiles.createdAt})
          .from(attachmentFiles).where(and(eq(attachmentFiles.entityType,"asset"),eq(attachmentFiles.entityId,id))).orderBy(desc(attachmentFiles.id)),
      ]);
      const fieldMap=new Map(fields.map((f:any)=>[Number(f.id),f]));
      const categoryId=rows[0].categoryId==null?null:Number(rows[0].categoryId);
      const links=categoryId?await db.select().from(assetSpecificationFieldCategories).where(eq(assetSpecificationFieldCategories.categoryId,categoryId)):[];
      const linkedIds=new Set(links.map((x:any)=>Number(x.fieldId)));
      const validValues=values.filter((v:any)=>{const field=fieldMap.get(Number(v.fieldId)); if(!field||field.categoryId==null) return false; const code=String(field.code||"").toLowerCase(); if(/^(manufacturer|model|brand)(_|$)/.test(code)) return false; return Number(field.categoryId)===categoryId || linkedIds.has(Number(field.id));});
      return json(res,{...rows[0],specificationValues:validValues.map((v:any)=>({...v,field:fieldMap.get(Number(v.fieldId))||null})),attachments:files});
    } catch(error) {
      console.error("Asset detail query failed",error);
      return json(res,{message:"Không thể tải chi tiết tài sản."},500);
    }
  });

  app.post("/api/asset/assets", async (req, res) => {
    if (!(await requirePermission(req,res,"assets","canCreate"))) return;
    const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình");
    const b = req.body || {}; if (!b.assetCode || !b.name) return bad(res, "Mã và tên tài sản là bắt buộc");
    if (String(b.status || "available") === "in_use" && !String(b.userText || "").trim()) return bad(res, "Tài sản ở trạng thái Đang sử dụng phải có thông tin Người sử dụng");
    const categoryId = b.categoryId ? Number(b.categoryId) : null;
    const specError = await validateSpecificationValues(db, categoryId, b.specificationValues);
    if (specError) return bad(res, specError);
    const assetRow = { assetCode: String(b.assetCode).trim(), name: String(b.name).trim(), categoryId, departmentId: b.departmentId ? Number(b.departmentId) : null, locationId: b.locationId ? Number(b.locationId) : null, warehouseId: b.warehouseId ? Number(b.warehouseId) : null, status: b.status || "available", serialNumber: b.serialNumber || null, userText: b.userText ? String(b.userText).trim() : null, note: b.note || null };
    // Do not report success unless the parent asset ID and all non-empty specification values
    // have been persisted. mysql2/Drizzle adapter versions expose insertId in different shapes.
    let assetId = 0;
    await db.transaction(async (tx: any) => {
      const result: any = await tx.insert(assets).values(assetRow);
      assetId = Number(result?.[0]?.insertId || result?.insertId || result?.[0]?.[0]?.insertId || 0);
      if (!assetId) {
        const inserted: any[] = await tx.select({ id: assets.id }).from(assets).where(eq(assets.assetCode, assetRow.assetCode)).orderBy(desc(assets.id)).limit(1);
        assetId = Number(inserted[0]?.id || 0);
      }
      if (!assetId) throw new Error("Không xác định được mã ID tài sản sau khi lưu.");
      const specs = (Array.isArray(b.specificationValues) ? b.specificationValues : [])
        .filter((x: any) => x?.fieldId && String(x.value ?? "").trim() !== "")
        .map((x: any) => ({ assetId, fieldId: Number(x.fieldId), value: String(x.value).trim() }));
      if (specs.length) await tx.insert(assetSpecificationValues).values(specs);
      const persisted: any[] = await tx.select({ id: assetSpecificationValues.id }).from(assetSpecificationValues).where(eq(assetSpecificationValues.assetId, assetId));
      if (persisted.length !== specs.length) throw new Error("Thông số kỹ thuật chưa được lưu đầy đủ. Vui lòng thử lại.");
    });
    return json(res, { ok: true, assetId, specificationCount: Array.isArray(b.specificationValues) ? b.specificationValues.filter((x: any) => x?.fieldId && String(x.value ?? "").trim() !== "").length : 0 }, 201);
  });
  app.patch("/api/asset/assets/:id", async (req, res) => {
    if (!(await requirePermission(req,res,"assets","canEdit"))) return;
    const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình");
    const id = Number(req.params.id);
    const { specificationValues, ...assetBody } = req.body || {};
    if (String(assetBody.status || "") === "in_use" && !String(assetBody.userText || "").trim()) return bad(res, "Tài sản ở trạng thái Đang sử dụng phải có thông tin Người sử dụng");
    const current = await db.select({ categoryId: assets.categoryId }).from(assets).where(eq(assets.id, id)).limit(1);
    const categoryId = assetBody.categoryId !== undefined ? (assetBody.categoryId ? Number(assetBody.categoryId) : null) : (current[0]?.categoryId ?? null);
    if (Array.isArray(specificationValues)) {
      const specError = await validateSpecificationValues(db, categoryId, specificationValues);
      if (specError) return bad(res, specError);
    }
    await db.transaction(async (tx: any) => {
      await tx.update(assets).set(assetBody).where(eq(assets.id, id));
      if (Array.isArray(specificationValues)) {
        await tx.delete(assetSpecificationValues).where(eq(assetSpecificationValues.assetId, id));
        const rows = specificationValues.filter((x: any) => x?.fieldId && String(x.value ?? "").trim() !== "").map((x: any) => ({ assetId: id, fieldId: Number(x.fieldId), value: String(x.value).trim() }));
        if (rows.length) await tx.insert(assetSpecificationValues).values(rows);
        const persisted: any[] = await tx.select({ id: assetSpecificationValues.id }).from(assetSpecificationValues).where(eq(assetSpecificationValues.assetId, id));
        if (persisted.length !== rows.length) throw new Error("Thông số kỹ thuật chưa được cập nhật đầy đủ. Vui lòng thử lại.");
      }
    });
    return json(res, { ok: true });
  });
  app.delete("/api/asset/assets/:id", async (req, res) => {
    if (!(await requirePermission(req,res,"assets","canDelete"))) return;
    const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình");
    const id = Number(req.params.id);
    await db.delete(assetSpecificationValues).where(eq(assetSpecificationValues.assetId, id));
    await db.delete(assets).where(eq(assets.id, id)); return json(res, { ok: true });
  });

  const simpleCrud = (route: string, table: any, fields: string[]) => {
    app.post(`/api/asset/${route}`, async (req, res) => { if (!(await requirePermission(req,res,"assets","canCreate"))) return; const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình"); const values: any = {}; for (const f of fields) values[f] = req.body?.[f] ?? null; await db.insert(table).values(values); return json(res, { ok: true }, 201); });
    app.patch(`/api/asset/${route}/:id`, async (req, res) => { if (!(await requirePermission(req,res,"assets","canEdit"))) return; const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình"); await db.update(table).set(req.body).where(eq(table.id, Number(req.params.id))); return json(res, { ok: true }); });
    app.delete(`/api/asset/${route}/:id`, async (req, res) => { if (!(await requirePermission(req,res,"assets","canDelete"))) return; const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình"); await db.delete(table).where(eq(table.id, Number(req.params.id))); return json(res, { ok: true }); });
  };
  app.post("/api/asset/departments", async (req,res)=>{
    if (!(await requirePermission(req,res,"assets","canCreate"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const name=String(req.body?.name||"").trim();
      let code=String(req.body?.code||"").trim();
      if(!name)return bad(res,"Tên bộ phận là bắt buộc");
      if(!code) code=name.toUpperCase().replace(/[^A-Z0-9À-ỸĐ]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,32)||`BP-${Date.now()}`;
      const dup=await db.select({id:departments.id}).from(departments).where(eq(departments.code,code)).limit(1);
      if(dup.length)return json(res,{message:`Mã bộ phận “${code}” đã tồn tại. Hãy chọn mã khác.`},409);
      const r:any=await db.insert(departments).values({code,name,active:Number(req.body?.active??1)?1:0});
      return json(res,{ok:true,id:Number(r.insertId||0)},201);
    } catch(error){console.error("Department create failed",error);return json(res,{message:"Không thể thêm bộ phận. Kiểm tra mã bộ phận có bị trùng hay không."},500);}
  });
  app.patch("/api/asset/departments/:id", async (req,res)=>{
    if (!(await requirePermission(req,res,"assets","canEdit"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const id=Number(req.params.id); const body:any={};
      if(req.body?.name!==undefined){const name=String(req.body.name).trim();if(!name)return bad(res,"Tên bộ phận là bắt buộc");body.name=name;}
      if(req.body?.code!==undefined){const code=String(req.body.code).trim();if(!code)return bad(res,"Mã bộ phận là bắt buộc");const dup=await db.select({id:departments.id}).from(departments).where(and(eq(departments.code,code),sql`${departments.id} <> ${id}`)).limit(1);if(dup.length)return json(res,{message:`Mã bộ phận “${code}” đã được sử dụng bởi bộ phận khác.`},409);body.code=code;}
      if(req.body?.active!==undefined)body.active=Number(req.body.active)?1:0;
      if(!Object.keys(body).length)return json(res,{ok:true});
      await db.update(departments).set(body).where(eq(departments.id,id)); return json(res,{ok:true});
    } catch(error){console.error("Department update failed",error);return json(res,{message:"Không thể cập nhật bộ phận. Kiểm tra mã bộ phận có bị trùng hay không."},500);}
  });
  app.delete("/api/asset/departments/:id", async (req,res)=>{
    if (!(await requirePermission(req,res,"assets","canDelete"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const id=Number(req.params.id);
      const row:any=(await db.select().from(departments).where(eq(departments.id,id)).limit(1))[0];
      if(!row)return json(res,{message:"Không tìm thấy bộ phận."},404);
      const legacyMap:any={"ban cà mau":"BCM","ban cần thơ":"BCT","ban quảng trị":"BQT","ban đông anh":"BĐA","ban đội cấn":"BĐC","p.kd":"KD","p.qltk":"QLTK","p.tchc&kh":"TCHC&KH","p.tckt":"TCKT"};
      const keyName=String(row.name||"").trim().toLowerCase(); const keyCode=String(row.code||"").trim().toLowerCase();
      const canonicalCode=legacyMap[keyName]||legacyMap[keyCode];
      if(canonicalCode){
        const target:any=(await db.select().from(departments).where(eq(departments.code,canonicalCode)).limit(1))[0];
        if(target && Number(target.id)!==id){
          for(const [table,column] of [[assets,"departmentId"],[assetUsers,"departmentId"],[tickets,"departmentId"],[assetAllocations,"departmentId"],[inventoryChecks,"departmentId"],[reportTemplates,"departmentId"]] as any[]) await db.update(table).set({[column]:Number(target.id)}).where(eq(table[column],id));
          await db.delete(departments).where(eq(departments.id,id));
          return json(res,{ok:true,mergedInto:target.id});
        }
      }
      const [assetRows,userRows,ticketRows,allocRows,checkRows,reportRows]=await Promise.all([
        db.select({id:assets.id}).from(assets).where(eq(assets.departmentId,id)).limit(1),
        db.select({id:assetUsers.id}).from(assetUsers).where(eq(assetUsers.departmentId,id)).limit(1),
        db.select({id:tickets.id}).from(tickets).where(eq(tickets.departmentId,id)).limit(1),
        db.select({id:assetAllocations.id}).from(assetAllocations).where(eq(assetAllocations.departmentId,id)).limit(1),
        db.select({id:inventoryChecks.id}).from(inventoryChecks).where(eq(inventoryChecks.departmentId,id)).limit(1),
        db.select({id:reportTemplates.id}).from(reportTemplates).where(eq(reportTemplates.departmentId,id)).limit(1),
      ]);
      if(assetRows.length||userRows.length||ticketRows.length||allocRows.length||checkRows.length||reportRows.length)return json(res,{message:"Không thể xóa bộ phận đang được sử dụng. Hãy chuyển dữ liệu sang bộ phận khác trước."},409);
      await db.delete(departments).where(eq(departments.id,id)); return json(res,{ok:true});
    } catch(error){ console.error("Department delete failed",error); return json(res,{message:error?.message||"Không thể xóa bộ phận."},500); }
  });
  app.post("/api/asset/locations", async (req,res)=>{
    if (!(await requirePermission(req,res,"assets","canCreate"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const name=String(req.body?.name||"").trim();
      const description=req.body?.description?String(req.body.description).trim():null;
      if(!name)return bad(res,"Tên địa điểm là bắt buộc");
      const exists=await db.select({id:locations.id}).from(locations).where(eq(locations.name,name)).limit(1);
      if(exists.length)return json(res,{message:"Địa điểm đã tồn tại."},409);
      const r:any=await db.insert(locations).values({name,description,active:1});
      return json(res,{ok:true,id:Number(r.insertId||0)},201);
    } catch(error){ console.error("Location create failed",error); return json(res,{message:"Không thể thêm địa điểm. Kiểm tra kết nối/database và thử lại."},500); }
  });
  app.patch("/api/asset/locations/:id", async (req,res)=>{
    if (!(await requirePermission(req,res,"assets","canEdit"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const id=Number(req.params.id); const name=req.body?.name!==undefined?String(req.body.name).trim():undefined;
      const body:any={}; if(name!==undefined)body.name=name; if(req.body?.description!==undefined)body.description=req.body.description?String(req.body.description).trim():null; if(req.body?.active!==undefined)body.active=Number(req.body.active)?1:0;
      if(name!==undefined){ if(!name)return bad(res,"Tên địa điểm là bắt buộc"); const dup=await db.select({id:locations.id}).from(locations).where(and(eq(locations.name,name),sql`${locations.id} <> ${id}`)).limit(1); if(dup.length)return json(res,{message:"Địa điểm đã tồn tại."},409); }
      await db.update(locations).set(body).where(eq(locations.id,id)); return json(res,{ok:true});
    } catch(error){ console.error("Location update failed",error); return json(res,{message:"Không thể cập nhật địa điểm."},500); }
  });
  app.delete("/api/asset/locations/:id", async (req,res)=>{
    if (!(await requirePermission(req,res,"assets","canDelete"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try { const id=Number(req.params.id); const [assetRows,networkRows]=await Promise.all([db.select({id:assets.id}).from(assets).where(eq(assets.locationId,id)).limit(1),db.select({id:networkDevices.id}).from(networkDevices).where(eq(networkDevices.locationId,id)).limit(1)]); if(assetRows.length||networkRows.length)return json(res,{message:"Không thể xóa địa điểm đang được sử dụng. Hãy chuyển dữ liệu sang địa điểm khác trước."},409); await db.delete(locations).where(eq(locations.id,id)); return json(res,{ok:true}); }
    catch(error){ console.error("Location delete failed",error); return json(res,{message:"Không thể xóa địa điểm."},500); }
  });
  app.post("/api/asset/categories", async (req,res)=>{ if (!(await requirePermission(req,res,"assets","canCreate"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const name=String(req.body?.name||"").trim(); if(!name)return bad(res,"Tên loại tài sản là bắt buộc"); if(["hạ tầng & mạng","bản quyền & dịch vụ"].includes(name.toLowerCase())) return bad(res,"Không thể tạo danh mục nghiệp vụ này trong Loại tài sản. Hạ tầng & Mạng và Bản quyền & Dịch vụ được quản lý tại module riêng."); const r=await db.insert(assetCategories).values({name,description:req.body?.description||null}); const id=Number((r as any).insertId||0); return json(res,{ok:true,id},201); });
  app.patch("/api/asset/categories/:id", async (req,res)=>{ if (!(await requirePermission(req,res,"assets","canEdit"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const body:any={...req.body}; if(body.name!==undefined){body.name=String(body.name).trim(); if(!body.name)return bad(res,"Tên loại tài sản là bắt buộc"); if(["hạ tầng & mạng","bản quyền & dịch vụ"].includes(body.name.toLowerCase())) return bad(res,"Không thể đặt tên danh mục nghiệp vụ này trong Loại tài sản.");} await db.update(assetCategories).set(body).where(eq(assetCategories.id,Number(req.params.id))); return json(res,{ok:true}); });
  app.delete("/api/asset/categories/:id", async (req,res)=>{ if (!(await requirePermission(req,res,"assets","canDelete"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const id=Number(req.params.id); const [assetRows,inventoryRows]=await Promise.all([db.select({id:assets.id}).from(assets).where(eq(assets.categoryId,id)).limit(1),db.select({id:inventoryItems.id}).from(inventoryItems).where(eq(inventoryItems.categoryId,id)).limit(1)]); if(assetRows.length||inventoryRows.length)return json(res,{message:"Không thể xóa loại tài sản đang được sử dụng. Hãy đổi loại của tài sản/vật tư trước."},409); const fieldRows:any[]=await db.select({id:assetSpecificationFields.id}).from(assetSpecificationFields).where(eq(assetSpecificationFields.categoryId,id));
    for(const field of fieldRows){
      const linkedElsewhere=await db.select({categoryId:assetSpecificationFieldCategories.categoryId}).from(assetSpecificationFieldCategories).where(and(eq(assetSpecificationFieldCategories.fieldId,Number(field.id)),sql`${assetSpecificationFieldCategories.categoryId} <> ${id}`)).limit(1);
      if(linkedElsewhere.length){ await db.update(assetSpecificationFields).set({active:1,categoryId:Number(linkedElsewhere[0].categoryId)}).where(eq(assetSpecificationFields.id,Number(field.id))); }
      else { await db.delete(assetSpecificationValues).where(eq(assetSpecificationValues.fieldId,Number(field.id))); await db.delete(assetSpecificationFieldCategories).where(eq(assetSpecificationFieldCategories.fieldId,Number(field.id))); await db.delete(assetSpecificationFields).where(eq(assetSpecificationFields.id,Number(field.id))); }
    }
    await db.delete(assetSpecificationFieldCategories).where(eq(assetSpecificationFieldCategories.categoryId,id));
    await db.delete(assetCategories).where(eq(assetCategories.id,id)); return json(res,{ok:true}); });

  app.get("/api/asset/users", async (req, res) => { if (!(await requirePermission(req,res,"users","canView"))) return; const db = await getDb(); if (!db) return json(res, []); return json(res, await db.select().from(assetUsers).where(eq(assetUsers.active,1)).orderBy(assetUsers.fullName)); });
  app.post("/api/asset/users", async (req, res) => { if (!(await requirePermission(req,res,"users","canCreate"))) return; const db = await getDb(); if (!db) return bad(res, "DATABASE_URL chưa được cấu hình"); const b=req.body||{}; if(!b.employeeCode||!b.fullName) return bad(res,"Mã nhân sự và họ tên là bắt buộc"); await db.insert(assetUsers).values({employeeCode:b.employeeCode,fullName:b.fullName,email:b.email||null,phone:b.phone||null,departmentId:b.departmentId||null,position:b.position||null,role:b.role||"operator",active:1}); return json(res,{ok:true},201); });
  app.patch("/api/asset/users/:id", async (req,res)=>{if(!(await requirePermission(req,res,"users","canEdit")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");await db.update(assetUsers).set(req.body).where(eq(assetUsers.id,Number(req.params.id)));return json(res,{ok:true});});
  app.delete("/api/asset/users/:id", async (req,res)=>{if(!(await requirePermission(req,res,"users","canDelete")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");const id=Number(req.params.id);const [assetRef,allocRef,handoverRef]=await Promise.all([db.select({id:assets.id}).from(assets).where(eq(assets.assignedUserId,id)).limit(1),db.select({id:assetAllocations.id}).from(assetAllocations).where(eq(assetAllocations.userId,id)).limit(1),db.select({id:handoverRecords.id}).from(handoverRecords).where(or(eq(handoverRecords.fromUserId,id),eq(handoverRecords.toUserId,id))).limit(1)]);if(assetRef.length||allocRef.length||handoverRef.length){await db.update(assetUsers).set({active:0}).where(eq(assetUsers.id,id));return json(res,{ok:true,mode:"deactivate"});}await db.delete(assetUsers).where(eq(assetUsers.id,id));return json(res,{ok:true,mode:"delete"});});

  app.get("/api/asset/inventory-warehouses", async (req,res)=>{
    if (!(await requirePermission(req,res,"inventory","canView"))) return;
    const db=await getDb(); if(!db)return json(res,[]);
    return json(res,await db.select().from(inventoryWarehouses).orderBy(inventoryWarehouses.name));
  });
  app.post("/api/asset/inventory-warehouses", async (req,res)=>{
    if (!(await requirePermission(req,res,"inventory","canCreate"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    const name=String(req.body?.name||"").trim(); if(!name)return bad(res,"Tên kho là bắt buộc");
    const exists=await db.select({id:inventoryWarehouses.id}).from(inventoryWarehouses).where(eq(inventoryWarehouses.name,name)).limit(1);
    if(exists.length)return json(res,{message:"Tên kho đã tồn tại."},409);
    const r=await db.insert(inventoryWarehouses).values({name,note:req.body?.note||null,active:1});
    return json(res,{ok:true,id:Number((r as any).insertId||0)},201);
  });
  app.patch("/api/asset/inventory-warehouses/:id", async (req,res)=>{
    if (!(await requirePermission(req,res,"inventory","canEdit"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    const id=Number(req.params.id); const body:any={}; if(req.body?.name!==undefined)body.name=String(req.body.name).trim(); if(req.body?.note!==undefined)body.note=req.body.note||null; if(req.body?.active!==undefined)body.active=Number(req.body.active)?1:0;
    if(body.name){const dup=await db.select({id:inventoryWarehouses.id}).from(inventoryWarehouses).where(and(eq(inventoryWarehouses.name,body.name),sql`${inventoryWarehouses.id} <> ${id}`)).limit(1); if(dup.length)return json(res,{message:"Tên kho đã tồn tại."},409);}
    await db.update(inventoryWarehouses).set(body).where(eq(inventoryWarehouses.id,id)); return json(res,{ok:true});
  });
  app.delete("/api/asset/inventory-warehouses/:id", async (req,res)=>{
    if (!(await requirePermission(req,res,"inventory","canDelete"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const id=Number(req.params.id);
    const used=await db.select({id:inventoryItems.id}).from(inventoryItems).where(eq(inventoryItems.warehouseId,id)).limit(1);
    if(used.length)return json(res,{message:"Không thể xóa kho đang có vật tư/thiết bị. Hãy chuyển các mặt hàng sang kho khác trước."},409);
    await db.delete(inventoryWarehouses).where(eq(inventoryWarehouses.id,id)); return json(res,{ok:true});
  });
  app.get("/api/asset/inventory", async (req,res)=>{
    if(!(await requirePermission(req,res,"inventory","canView")))return;
    const db=await getDb(); if(!db)return json(res,[]);
    try {
      const q=String(req.query.q||"").trim();
      const warehouseId=req.query.warehouseId?Number(req.query.warehouseId):null;
      const categoryId=req.query.categoryId?Number(req.query.categoryId):null;
      const requestedStatus=String(req.query.status||"").trim();
      const allowedInventoryStatuses=new Set(["available","repair","liquidation","unused"]);
      const status=allowedInventoryStatuses.has(requestedStatus)?requestedStatus:"";
      const [itemRowsRaw,warehouseRows,categoryRows,locationRows,assetRows,rawLicenseRows]=await Promise.all([
        db.select().from(inventoryItems).orderBy(desc(inventoryItems.id)),
        db.select().from(inventoryWarehouses).orderBy(inventoryWarehouses.name),
        db.select().from(assetCategories),
        db.select().from(locations),
        db.select().from(assets).where(or(eq(assets.status,"in_use"),eq(assets.status,"available"),eq(assets.status,"pending_allocation"),eq(assets.status,"pending_return"),eq(assets.status,"repair"),eq(assets.status,"damaged"))),
        db.select().from(licenses).where(or(eq(licenses.status,"active"),eq(licenses.status,"expiring")))
      ]);
      const wmap=new Map(warehouseRows.map((x:any)=>[Number(x.id),x.name]));
      const cmap=new Map(categoryRows.map((x:any)=>[Number(x.id),x.name]));
      const locmap=new Map(locationRows.map((x:any)=>[Number(x.id),x.name]));
      const textMatch=(value:any)=>!q||String(value||"").toLowerCase().includes(q.toLowerCase());
      const statusMap:any={pending_allocation:"available",pending_return:"returned",in_use:"in_use",available:"available",repair:"repair",damaged:"liquidation"};
      const statusLabel:any={pending_allocation:"Sẵn sàng cấp phát",available:"Sẵn sàng cấp phát",returned:"Thu hồi",in_use:"Đang sử dụng",repair:"Đang sửa chữa",liquidation:"Chờ thanh lý",unused:"Chưa sử dụng"};
      const itemRows=itemRowsRaw
        .filter((r:any)=>!String(r.itemCode||"").startsWith("LIC-"))
        .filter((r:any)=>!warehouseId||Number(r.warehouseId)===warehouseId)
        .filter((r:any)=>!categoryId||Number(r.categoryId)===categoryId)
        .filter((r:any)=>textMatch(`${r.itemCode} ${r.name} ${r.note||""}`))
        .map((r:any)=>{
          const categoryName=cmap.get(Number(r.categoryId))||"Chưa phân loại";
          const stockText=`${categoryName} ${r.name||""} ${r.itemCode||""}`.toLowerCase();
          const isConsumable=/(ram|cpu|ổ cứng|o cung|hdd|ssd|nvme|m\.2|phần mềm|phan mem|software|linh kiện|linh kien|license|bản quyền|ban quyen|memory|processor)/i.test(stockText);
          const inventoryStatus=isConsumable?"unused":(r.warehouseId?"available":"unused");
          return {...r,recordType:"inventory",warehouseName:wmap.get(Number(r.warehouseId))||"Chưa xác định kho",categoryName,inventoryStatus,inventoryStatusLabel:inventoryStatus==="available"?"Sẵn sàng cấp phát":"Chưa sử dụng"};
        });
      const assetRowsMapped=assetRows
        .filter((a:any)=>!String(a.assetCode||"").startsWith("LIC-"))
        .filter((a:any)=>!warehouseId||Number(a.warehouseId)===warehouseId)
        .filter((a:any)=>!categoryId||Number(a.categoryId)===categoryId)
        .filter((a:any)=>textMatch(`${a.assetCode} ${a.name} ${a.serialNumber||""} ${a.note||""}`))
        .map((a:any)=>({id:`asset-${a.id}`,sourceId:a.id,recordType:"asset",itemCode:a.assetCode,name:a.name,categoryId:a.categoryId,categoryName:cmap.get(Number(a.categoryId))||"Chưa phân loại",warehouseId:a.warehouseId||null,warehouseName:wmap.get(Number(a.warehouseId))||"Chưa xác định kho",unit:"cái",quantity:1,minimumQuantity:0,note:a.note||a.specifications||"",inventoryStatus:statusMap[a.status]||"unused",inventoryStatusLabel:statusLabel[statusMap[a.status]]||"Chưa sử dụng",assetStatus:a.status,locationName:locmap.get(Number(a.locationId))||"Chưa xác định địa điểm",serialNumber:a.serialNumber||null,userText:a.userText||null,specificationValues:[] }));
      const licenseRows=rawLicenseRows
        .filter((l:any)=>Math.max(Number(l.quantity||0)-Number(l.usedQuantity||0),0)>0)
        .filter((l:any)=>!warehouseId||Number(l.warehouseId)===warehouseId)
        .filter((l:any)=>textMatch(`${l.licenseCode} ${l.productName} ${l.note||""}`))
        .map((l:any)=>({id:`license-${l.id}`,sourceId:l.id,recordType:"license",itemCode:l.licenseCode,name:l.productName,categoryId:null,categoryName:"Bản quyền & Dịch vụ",warehouseId:l.warehouseId||null,warehouseName:wmap.get(Number(l.warehouseId))||"Chưa xác định kho",unit:"license",quantity:Math.max(Number(l.quantity||0)-Number(l.usedQuantity||0),0),minimumQuantity:0,note:l.note||`Hết hạn: ${l.expiryDate?new Date(l.expiryDate).toLocaleDateString("vi-VN"):"—"}`,inventoryStatus:"unused",inventoryStatusLabel:"Chưa sử dụng"}));
      let combined=[...itemRows,...assetRowsMapped,...licenseRows];
      const summaryStatuses=[
        ["available","Sẵn sàng cấp phát"],
        ["repair","Đang sửa chữa"],["liquidation","Chờ thanh lý"],["unused","Chưa sử dụng"]
      ];
      const summary=summaryStatuses.map(([key,label])=>({status:key,label,value:combined.filter((r:any)=>r.inventoryStatus===key).reduce((n:number,r:any)=>n+Math.max(Number(r.quantity||0),0),0)}));
      if(status)combined=combined.filter((r:any)=>r.inventoryStatus===status);
      return json(res,{rows:combined,summary});
    } catch(error){console.error("Inventory unified query failed",error);return json(res,{message:"Không thể tải dữ liệu kho thiết bị - vật tư."},500);}
  });
  app.post("/api/asset/inventory", async (req,res)=>{
    if(!(await requirePermission(req,res,"inventory","canCreate")))return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const b=req.body||{};
    if(!b.itemCode||!b.name)return bad(res,"Mã và tên vật tư là bắt buộc");
    const categoryId=b.categoryId?Number(b.categoryId):null; const warehouseId=b.warehouseId?Number(b.warehouseId):null;
    if(categoryId){const cat=await db.select({id:assetCategories.id}).from(assetCategories).where(eq(assetCategories.id,categoryId)).limit(1);if(!cat.length)return json(res,{message:"Loại tài sản/vật tư không tồn tại trong danh mục dùng chung."},400);}
    if(warehouseId){const wh=await db.select({id:inventoryWarehouses.id}).from(inventoryWarehouses).where(eq(inventoryWarehouses.id,warehouseId)).limit(1);if(!wh.length)return json(res,{message:"Kho lưu trữ không tồn tại."},400);}
    await db.insert(inventoryItems).values({itemCode:String(b.itemCode),name:String(b.name),categoryId,warehouseId,locationId:b.locationId?Number(b.locationId):null,unit:String(b.unit||"cái"),quantity:Number(b.quantity||0),minimumQuantity:Number(b.minimumQuantity||0),note:b.note||null}); return json(res,{ok:true},201);
  });
  app.patch("/api/asset/inventory/:id", async (req,res)=>{
    if(!(await requirePermission(req,res,"inventory","canEdit")))return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const body:any={...req.body};
    if(body.categoryId!==undefined){body.categoryId=body.categoryId?Number(body.categoryId):null; if(body.categoryId){const cat=await db.select({id:assetCategories.id}).from(assetCategories).where(eq(assetCategories.id,body.categoryId)).limit(1);if(!cat.length)return json(res,{message:"Loại tài sản/vật tư không tồn tại."},400);}}
    if(body.warehouseId!==undefined){body.warehouseId=body.warehouseId?Number(body.warehouseId):null; if(body.warehouseId){const wh=await db.select({id:inventoryWarehouses.id}).from(inventoryWarehouses).where(eq(inventoryWarehouses.id,body.warehouseId)).limit(1);if(!wh.length)return json(res,{message:"Kho lưu trữ không tồn tại."},400);}}
    await db.update(inventoryItems).set(body).where(eq(inventoryItems.id,Number(req.params.id))); return json(res,{ok:true});
  });
  app.delete("/api/asset/inventory/:id", async (req,res)=>{if(!(await requirePermission(req,res,"inventory","canDelete")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");await db.delete(inventoryItems).where(eq(inventoryItems.id,Number(req.params.id)));return json(res,{ok:true});});

  app.get("/api/asset/maintenance", async (req,res)=>{if(!(await requirePermission(req,res,"maintenance","canView")))return;const db=await getDb();if(!db)return json(res,[]);const rows:any[]=await db.select().from(maintenanceRecords).orderBy(desc(maintenanceRecords.id));const [usersRows,assetRows,networkRows,ticketRows]=await Promise.all([db.select().from(assetUsers),db.select().from(assets),db.select().from(networkDevices),db.select().from(tickets)]);const um=new Map(usersRows.map((x:any)=>[Number(x.id),x.fullName]));const am=new Map(assetRows.map((x:any)=>[Number(x.id),x]));const nm=new Map(networkRows.map((x:any)=>[Number(x.id),x]));const tm=new Map(ticketRows.map((x:any)=>[Number(x.id),x]));return json(res,rows.map(r=>({...r,assignedToName:um.get(Number(r.assignedToId))||"Chưa phân công",requestedByName:um.get(Number(r.requestedById))||"—",assetName:am.get(Number(r.assetId))?.name||"",assetCode:am.get(Number(r.assetId))?.assetCode||"",assetStatus:am.get(Number(r.assetId))?.status||"",networkName:nm.get(Number(r.networkDeviceId))?.name||"",networkCode:nm.get(Number(r.networkDeviceId))?.deviceCode||"",networkStatus:nm.get(Number(r.networkDeviceId))?.status||"",ticketCode:tm.get(Number(r.ticketId))?.ticketCode||"",ticketStatus:tm.get(Number(r.ticketId))?.status||""})));});
  app.post("/api/asset/maintenance", async (req,res)=>{if(!(await requirePermission(req,res,"maintenance","canCreate")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");const b=req.body||{};if(!b.issue)return bad(res,"Nội dung sự cố là bắt buộc");const assetId=b.assetId?Number(b.assetId):null;const networkDeviceId=b.networkDeviceId?Number(b.networkDeviceId):null;if(!assetId&&!networkDeviceId)return bad(res,"Tài sản hoặc thiết bị hạ tầng là bắt buộc");let ticketId=b.ticketId?Number(b.ticketId):null;if(b.ticketId){const byId=await db.select({id:tickets.id}).from(tickets).where(eq(tickets.id,Number(b.ticketId))).limit(1);ticketId=byId[0]?.id?Number(byId[0].id):null;}else if(b.ticketCode){const ticketValue=String(b.ticketCode).trim();const tr=await db.select({id:tickets.id}).from(tickets).where(eq(tickets.ticketCode,ticketValue)).limit(1);if(tr[0])ticketId=Number(tr[0].id);else if(/^\d+$/.test(ticketValue)){const byId=await db.select({id:tickets.id}).from(tickets).where(eq(tickets.id,Number(ticketValue))).limit(1);ticketId=byId[0]?.id?Number(byId[0].id):null;}else ticketId=null;}
if(!ticketId&&b.createHelpdeskTicket&&!b.ticketCode){
  let targetCode="",targetName="",targetLocationId:number|null=null,targetDepartmentId:number|null=null;
  if(networkDeviceId&&networkDeviceId>0){
    const nr:any=(await db.select().from(networkDevices).where(eq(networkDevices.id,networkDeviceId)).limit(1))[0];
    if(nr){targetCode=nr.deviceCode;targetName=nr.name;targetLocationId=nr.locationId||null;}
  }else if(assetId){
    const ar:any=(await db.select().from(assets).where(eq(assets.id,assetId)).limit(1))[0];
    if(ar){targetCode=ar.assetCode;targetName=ar.name;targetLocationId=ar.locationId||null;targetDepartmentId=ar.departmentId||null;}
  }
  const code=`HD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*90+10)}`;
  const ticketTitle=`Bảo trì / sửa chữa: ${targetCode?targetCode+" · ":""}${targetName||"Thiết bị"}`.slice(0,240);
  const description=[
    "Yêu cầu được tạo từ hồ sơ Bảo trì & Sửa chữa.",
    targetCode?`Mã thiết bị: ${targetCode}`:"",
    targetName?`Thiết bị: ${targetName}`:"",
    `Nội dung yêu cầu: ${String(b.issue||"").trim()}`,
    b.costNote?`Ghi chú / chi phí: ${String(b.costNote).trim()}`:""
  ].filter(Boolean).join("\n");
  const inserted:any=await db.insert(tickets).values({ticketCode:code,title:ticketTitle,description,priority:"medium",status:"new",assetId:assetId||null,departmentId:targetDepartmentId,locationId:targetLocationId});
  const insertedId=Number(inserted?.[0]?.insertId||inserted?.insertId||0);
  if(insertedId)ticketId=insertedId;
  else {const created:any=(await db.select({id:tickets.id}).from(tickets).where(eq(tickets.ticketCode,code)).limit(1))[0];ticketId=created?.id?Number(created.id):null;}
  if(ticketId){const session=await getSession(req);await db.insert(ticketUpdates).values({ticketId,authorId:session?.id||null,status:"new",note:"Ticket được tự động tạo từ hồ sơ bảo trì / sửa chữa."});}
}
await db.insert(maintenanceRecords).values({assetId:assetId||0,networkDeviceId,requestedById:b.requestedById?Number(b.requestedById):null,assignedToId:b.assignedToId?Number(b.assignedToId):null,ticketId,status:"open",issue:String(b.issue),resolution:b.resolution||null,costNote:b.costNote||null});if(assetId)await db.update(assets).set({status:"repair"}).where(eq(assets.id,assetId));if(networkDeviceId)await db.update(networkDevices).set({status:"maintenance"}).where(eq(networkDevices.id,networkDeviceId));if(ticketId){const patch:any={status:"in_progress"};if(assetId)patch.assetId=assetId;await db.update(tickets).set(patch).where(eq(tickets.id,ticketId));}return json(res,{ok:true},201);});
  app.patch("/api/asset/maintenance/:id", async (req,res)=>{if(!(await requirePermission(req,res,"maintenance","canEdit")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");const id=Number(req.params.id);const body={...req.body};if(body.status==="completed")body.closedAt=new Date();if(body.ticketId!==undefined)body.ticketId=body.ticketId?Number(body.ticketId):null;delete body.assetId;delete body.networkDeviceId;const current=await db.select({assetId:maintenanceRecords.assetId,networkDeviceId:maintenanceRecords.networkDeviceId,ticketId:maintenanceRecords.ticketId}).from(maintenanceRecords).where(eq(maintenanceRecords.id,id)).limit(1);await db.update(maintenanceRecords).set(body).where(eq(maintenanceRecords.id,id));const row=current[0];if(row){if(body.status==="completed"){if(row.assetId)await db.update(assets).set({status:Number(row.networkDeviceId)<0?"in_use":"available"}).where(eq(assets.id,Number(row.assetId)));if(Number(row.networkDeviceId)>0)await db.update(networkDevices).set({status:"active"}).where(eq(networkDevices.id,Number(row.networkDeviceId)));if(row.ticketId)await db.update(tickets).set({status:"completed"}).where(eq(tickets.id,Number(row.ticketId)));}else if(body.status==="cancelled"){if(row.assetId)await db.update(assets).set({status:Number(row.networkDeviceId)<0?"in_use":"available"}).where(eq(assets.id,Number(row.assetId)));if(Number(row.networkDeviceId)>0)await db.update(networkDevices).set({status:"active"}).where(eq(networkDevices.id,Number(row.networkDeviceId)));}}return json(res,{ok:true});});

  app.delete("/api/asset/maintenance/:id", async (req,res)=>{
    if(!(await requirePermission(req,res,"maintenance","canDelete")))return;
    const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try{
      const id=Number(req.params.id);
      const row:any=(await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id,id)).limit(1))[0];
      if(!row)return json(res,{message:"Không tìm thấy hồ sơ bảo trì."},404);
      if(["open","in_progress"].includes(String(row.status))){
        if(row.assetId)await db.update(assets).set({status:Number(row.networkDeviceId)<0?"in_use":"available"}).where(eq(assets.id,Number(row.assetId)));
        if(Number(row.networkDeviceId)>0)await db.update(networkDevices).set({status:"active"}).where(eq(networkDevices.id,Number(row.networkDeviceId)));
      }
      await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id,id));
      return json(res,{ok:true});
    }catch(error:any){console.error("Maintenance DELETE failed",error);return json(res,{message:error?.message||"Không thể xóa hồ sơ bảo trì."},400);}
  });

  app.get("/api/asset/allocation/tickets", async (req,res)=>{
    if (!(await requirePermission(req,res,"allocation","canView"))) return;
    const db=await getDb(); if(!db)return json(res,[]);
    try {
      const rows:any[]=await db.select().from(tickets).orderBy(desc(tickets.id));
      return json(res,rows.map((t:any)=>({id:t.id,ticketCode:t.ticketCode,title:t.title,status:t.status,assetId:t.assetId||null,createdAt:t.createdAt,updatedAt:t.updatedAt})));
    } catch(error){ console.error("Allocation ticket list failed",error); return json(res,{message:"Không thể tải danh sách ticket."},500); }
  });

  app.get("/api/asset/allocations", async (req,res)=>{
    if (!(await requirePermission(req,res,"allocation","canView"))) return;
    const db=await getDb(); if(!db)return json(res,[]);
    try {
      const rows:any[]=await db.select().from(assetAllocations).orderBy(desc(assetAllocations.id));
      const [assetRows,userRows,warehouseRows,ticketRows,licenseRows,licenseLinks]=await Promise.all([db.select().from(assets),db.select().from(assetUsers),db.select().from(inventoryWarehouses),db.select().from(tickets),db.select().from(licenses),db.select().from(allocationLicenses)]);
      const amap=new Map(assetRows.map((x:any)=>[Number(x.id),x])); const umap=new Map(userRows.map((x:any)=>[Number(x.id),x])); const wmap=new Map(warehouseRows.map((x:any)=>[Number(x.id),x])); const tmap=new Map(ticketRows.map((x:any)=>[Number(x.id),x])); const lmap=new Map(licenseRows.map((x:any)=>[Number(x.id),x]));
      const linkMap=new Map<number,any[]>(); for(const link of licenseLinks as any[]){const arr=linkMap.get(Number(link.allocationId))||[]; const l=lmap.get(Number(link.licenseId)); if(l)arr.push({id:l.id,licenseCode:l.licenseCode,productName:l.productName,quantity:Number(link.quantity||0)}); linkMap.set(Number(link.allocationId),arr);}
      const statusText:any={in_use:"Đang sử dụng",available:"Sẵn sàng cấp phát",pending_allocation:"Sẵn sàng cấp phát",pending_return:"Chờ thu hồi",repair:"Đang sửa chữa",damaged:"Hư hỏng - chờ thanh lý",retired:"Đã thanh lý"};
      return json(res,rows.map((r:any)=>{const a=amap.get(Number(r.assetId)); const u=umap.get(Number(r.userId)); const w=wmap.get(Number(r.warehouseId)); const t=tmap.get(Number(r.ticketId)); const completed=t?.status==="completed"; const displayStatus=completed&&a?.status?statusText[a.status]||a.status:({pending_allocation:"Sẵn sàng cấp phát",active:"Đang sử dụng",pending_return:"Chờ thu hồi",returned:"Đã thu hồi",cancelled:"Đã hủy"} as any)[r.status]||r.status; return {...r,assetName:a?.name||"",assetCode:a?.assetCode||"",assetStatus:a?.status||"",assetStatusLabel:statusText[a?.status]||"—",displayStatus,assetSerial:a?.serialNumber||"",userName:r.userText||u?.fullName||amap.get(Number(r.assetId))?.userText||"",userText:r.userText||u?.fullName||amap.get(Number(r.assetId))?.userText||"",warehouseName:w?.name||"",ticketCode:t?.ticketCode||"",ticketTitle:t?.title||"",ticketStatus:t?.status||"",licenseAttachments:linkMap.get(Number(r.id))||[]};}));
    } catch(error){ console.error("Allocation list failed",error); return json(res,{message:"Không thể tải danh sách cấp phát."},500); }
  });

  app.post("/api/asset/allocations", async (req,res)=>{
    if (!(await requirePermission(req,res,"allocation","canCreate"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const b=req.body||{}; const mode=String(b.mode||"handover");
      const assetIds=(Array.isArray(b.assetIds)?b.assetIds:[b.assetId]).map((x:any)=>Number(x||0)).filter(Boolean);
      if(!assetIds.length)return bad(res,"Hãy chọn ít nhất một tài sản / thiết bị.");
      const uniqueAssetIds=[...new Set(assetIds)];
      const userText=String(b.userText||"").trim(); const userId=Number(b.userId||0); if(mode!=="return"&&!userText&&!userId)return bad(res,"Người nhận là bắt buộc");
      const licenseSelections=Array.isArray(b.licenseSelections)?b.licenseSelections:[];
      const assetsForWorkflow:any[]=[];
      for(const assetId of uniqueAssetIds){
        const asset=(await db.select().from(assets).where(eq(assets.id,assetId)).limit(1))[0] as any;
        if(!asset)return json(res,{message:`Không tìm thấy tài sản #${assetId}.`},404);
        if(mode==="return"){
          if(!["in_use","pending_return"].includes(String(asset.status)))return json(res,{message:`Tài sản ${asset.assetCode} không ở trạng thái đang sử dụng hoặc chờ thu hồi.`},409);
          let active=(await db.select().from(assetAllocations).where(and(eq(assetAllocations.assetId,assetId),or(eq(assetAllocations.status,"active"),eq(assetAllocations.status,"pending_return")))).orderBy(desc(assetAllocations.id)).limit(1))[0] as any;
          if(!active){
            const assignedUserId=Number(asset.assignedUserId||0);
            let returnUserId=assignedUserId;
            if(!returnUserId && asset.userText){
              const matched=await db.select({id:assetUsers.id}).from(assetUsers).where(eq(assetUsers.fullName,String(asset.userText))).limit(1);
              returnUserId=Number(matched[0]?.id||0);
            }
            if(!returnUserId && !String(asset.userText||"").trim())return json(res,{message:`Tài sản ${asset.assetCode} chưa có tên người sử dụng. Hãy nhập tên người sử dụng tại Thiết bị & tài sản trước khi thu hồi.`},409);
            const code=`AP-RET-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${asset.id}`;
            const ar:any=await db.insert(assetAllocations).values({
              allocationCode:code, assetId, userId:returnUserId||null, userText:String(asset.userText||"").trim()||null,
              departmentId:asset.departmentId||null, locationId:asset.locationId||null,
              warehouseId:asset.warehouseId||null, status:"active", note:asset.note||null
            });
            const syntheticId=Number(ar.insertId||0);
            active=(await db.select().from(assetAllocations).where(eq(assetAllocations.id,syntheticId)).limit(1))[0] as any;
          }
          assetsForWorkflow.push({asset,active});
        } else {
          if(String(asset.status)==="pending_allocation")return json(res,{message:`Tài sản ${asset.assetCode} đã có yêu cầu cấp phát đang chờ xử lý.`},409);
          if(String(asset.status)!=="available")return json(res,{message:`Tài sản ${asset.assetCode} chưa ở trạng thái Sẵn sàng cấp phát.`},409);
          assetsForWorkflow.push({asset});
        }
      }
      let ticketId=b.ticketId?Number(b.ticketId):null;
      let ticket:any=ticketId?(await db.select().from(tickets).where(eq(tickets.id,ticketId)).limit(1))[0] as any:null;
      if(ticketId&&!ticket)return json(res,{message:"Ticket không tồn tại."},400);
      if(!ticketId&&b.linkTicket){
        const requester=mode==="return"?"Bộ phận hỗ trợ":userText;
        const generatedCode=`HD-${String(Date.now()).slice(-6)}`;
        const codes=assetsForWorkflow.map(x=>x.asset.assetCode).join(", ");
        const title=mode==="return"?`Yêu cầu thu hồi: ${codes}`:`Yêu cầu cấp phát: ${codes}`;
        const description=mode==="return"?`Ticket được tự động tạo từ yêu cầu thu hồi tài sản: ${codes}. ${String(b.note||"")}`:`Ticket được tự động tạo từ yêu cầu cấp phát tài sản: ${codes} cho ${requester}. ${String(b.note||"")}`;
        const departmentId=mode==="return"?(assetsForWorkflow[0].asset.departmentId||null):(b.departmentId?Number(b.departmentId):assetsForWorkflow[0].asset.departmentId||null);
        const locationId=mode==="return"?(assetsForWorkflow[0].asset.locationId||null):(b.locationId?Number(b.locationId):assetsForWorkflow[0].asset.locationId||null);
        const recentCutoff=new Date(Date.now()-90_000);
        const recentMatches:any[]=await db.select().from(tickets).where(and(eq(tickets.title,title),eq(tickets.description,description),eq(tickets.status,"new"))).orderBy(desc(tickets.id)).limit(5);
        ticket=recentMatches.find((candidate:any)=>candidate.createdAt && new Date(candidate.createdAt).getTime()>=recentCutoff.getTime())||null;
        if(ticket){
          ticketId=Number(ticket.id);
        }else{
          const tr:any=await db.insert(tickets).values({ticketCode:generatedCode,title,description,priority:"medium",status:"new",assetId:assetsForWorkflow.length===1?assetsForWorkflow[0].asset.id:null,departmentId,locationId});
          ticketId=Number(tr.insertId||0);
          ticket=(await db.select().from(tickets).where(eq(tickets.id,ticketId)).limit(1))[0] as any;
          if(ticketId)await db.insert(ticketUpdates).values({ticketId,status:"new",note:`Tự động tạo từ yêu cầu ${mode==="return"?"thu hồi":"cấp phát"}. Tài sản: ${codes}. Người liên quan: ${requester}.`});
        }
      }
      const created:any[]=[];
      if(mode==="return"){
        for(const item of assetsForWorkflow){
          const active=item.active as any; const warehouseId=b.warehouseId?Number(b.warehouseId):(active.warehouseId||null);
          await db.update(assetAllocations).set({status:"pending_return",ticketId,warehouseId,note:b.note||active.note||null}).where(eq(assetAllocations.id,active.id));
          await db.update(assets).set({status:"pending_return"}).where(eq(assets.id,item.asset.id));
          if(ticketId && assetsForWorkflow.length===1)await db.update(tickets).set({assetId:item.asset.id}).where(eq(tickets.id,ticketId));
          if(ticket?.status==="completed"){
            await restoreAllocationLicenses(db,Number(active.id));
            await db.update(assetAllocations).set({status:"returned",returnedAt:new Date()}).where(eq(assetAllocations.id,active.id));
            const finalStatus=String(b.assetStatusAfter||"available");
            const safeStatus=["available","in_use","repair","damaged","pending_return"].includes(finalStatus)?finalStatus:"available";
            const previousUser=(await db.select({fullName:assetUsers.fullName}).from(assetUsers).where(eq(assetUsers.id,Number(active.userId))).limit(1))[0]?.fullName||item.asset.userText||null;
            const returnNote=previousUser?`Người sử dụng trước khi thu hồi: ${previousUser}`:"";
            await db.update(assets).set({status:safeStatus as any,warehouseId,assignedUserId:safeStatus==="in_use"?Number(active.userId):null,userText:safeStatus==="in_use"?(previousUser||item.asset.userText||null):null,note:appendAssetNote(item.asset.note,returnNote)}).where(eq(assets.id,item.asset.id));
            const code=`BB-TH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${item.asset.id}`;
            await db.insert(handoverRecords).values({documentCode:code,assetId:item.asset.id,allocationId:active.id,ticketId,fromUserId:active.userId,toUserId:null,type:"return",note:b.note||active.note||null});
            created.push({allocationId:active.id,status:"returned",assetId:item.asset.id});
          } else created.push({allocationId:active.id,status:"pending_return",assetId:item.asset.id});
        }
      } else {
        for(const item of assetsForWorkflow){
          const code=b.allocationCode?`${b.allocationCode}-${item.asset.id}`:`CAP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${item.asset.id}`;
          const result:any=await db.insert(assetAllocations).values({allocationCode:code,assetId:item.asset.id,userId:userId||null,userText,departmentId:b.departmentId?Number(b.departmentId):null,locationId:b.locationId?Number(b.locationId):null,warehouseId:b.warehouseId?Number(b.warehouseId):(item.asset.warehouseId?Number(item.asset.warehouseId):null),ticketId,note:b.note||null,status:"pending_allocation"});
          const allocationId=Number(result.insertId||0);
          await db.update(assets).set({status:"pending_allocation",userText}).where(eq(assets.id,item.asset.id));
          if(ticketId && assetsForWorkflow.length===1)await db.update(tickets).set({assetId:item.asset.id}).where(eq(tickets.id,ticketId));
          if(licenseSelections.length)await consumeAllocationLicenses(db,allocationId,licenseSelections);
          if(ticket?.status==="completed"){
            const assignedName=userText||item.asset.userText||null;
            const finalStatus=String(b.assetStatusAfter||"in_use");
            if(finalStatus==="in_use"){
              await db.update(assetAllocations).set({status:"active"}).where(eq(assetAllocations.id,allocationId));
              await db.update(assets).set({status:"in_use",userText:assignedName,departmentId:b.departmentId?Number(b.departmentId):(item.asset.departmentId||null),locationId:b.locationId?Number(b.locationId):(item.asset.locationId||null),warehouseId:null}).where(eq(assets.id,item.asset.id));
              const docCode=`BB-BG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${item.asset.id}`; await db.insert(handoverRecords).values({documentCode:docCode,assetId:item.asset.id,allocationId,ticketId,fromUserId:null,toUserId:userId||null,type:"handover",note:b.note||null});
              created.push({allocationId,status:"active",assetId:item.asset.id});
            } else {
              await db.update(assetAllocations).set({status:"cancelled"}).where(eq(assetAllocations.id,allocationId));
              await db.update(assets).set({status:finalStatus as any,userText:finalStatus==="in_use"?assignedName:null}).where(eq(assets.id,item.asset.id));
              if(licenseSelections.length)await restoreAllocationLicenses(db,allocationId);
              created.push({allocationId,status:"cancelled",assetId:item.asset.id});
            }
          } else created.push({allocationId,status:"pending_allocation",assetId:item.asset.id});
        }
      }
      return json(res,{ok:true,mode,allocationIds:created.map(x=>x.allocationId),items:created,ticketCode:ticket?.ticketCode||null},201);
    } catch(error:any){console.error("Allocation workflow failed",error);return json(res,{message:error?.message||"Không thể tạo yêu cầu cấp phát/thu hồi."},400);}
  });

  app.patch("/api/asset/allocations/:id/warehouse", async (req,res)=>{
    if (!(await requirePermission(req,res,"allocation","canEdit"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const id=Number(req.params.id); const warehouseId=req.body?.warehouseId?Number(req.body.warehouseId):null;
    const row=(await db.select().from(assetAllocations).where(eq(assetAllocations.id,id)).limit(1))[0] as any; if(!row)return json(res,{message:"Không tìm thấy phiếu cấp phát."},404);
    if(!["returned","pending_return"].includes(String(row.status)))return json(res,{message:"Chỉ có thể cập nhật kho đối với tài sản đã thu hồi hoặc đang chờ thu hồi."},409);
    if(warehouseId){const wh=await db.select({id:inventoryWarehouses.id}).from(inventoryWarehouses).where(eq(inventoryWarehouses.id,warehouseId)).limit(1);if(!wh.length)return json(res,{message:"Kho lưu trữ không tồn tại."},400);}
    await db.update(assetAllocations).set({warehouseId}).where(eq(assetAllocations.id,id));
    await db.update(assets).set({warehouseId}).where(eq(assets.id,row.assetId));
    return json(res,{ok:true});
  });

  app.delete("/api/asset/allocations/:id", async (req,res)=>{
    if (!(await requirePermission(req,res,"allocation","canDelete"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const id=Number(req.params.id);
      const row=(await db.select().from(assetAllocations).where(eq(assetAllocations.id,id)).limit(1))[0] as any;
      if(!row)return json(res,{message:"Không tìm thấy phiếu cấp phát/thu hồi."},404);
      const asset=(await db.select().from(assets).where(eq(assets.id,Number(row.assetId))).limit(1))[0] as any;
      const ticket=row.ticketId?(await db.select().from(tickets).where(eq(tickets.id,Number(row.ticketId))).limit(1))[0] as any:null;
      const cleanupAutoTicket=async()=>{
        if(!ticket)return;
        const refs=await db.select({id:assetAllocations.id}).from(assetAllocations).where(eq(assetAllocations.ticketId,Number(ticket.id))).limit(1);
        const autoCreated=String(ticket.description||"").startsWith("Ticket được tự động tạo từ yêu cầu");
        if(!refs.length&&autoCreated){
          await db.delete(ticketUpdates).where(eq(ticketUpdates.ticketId,Number(ticket.id)));
          await db.delete(tickets).where(eq(tickets.id,Number(ticket.id)));
        }
      };

      if(row.status==="pending_allocation"){
        await restoreAllocationLicenses(db,id);
        await db.delete(allocationLicenses).where(eq(allocationLicenses.allocationId,id));
        await db.update(assets).set({status:"available",assignedUserId:null,userText:null}).where(eq(assets.id,Number(row.assetId)));
        await db.delete(handoverRecords).where(eq(handoverRecords.allocationId,id));
        await db.delete(assetAllocations).where(eq(assetAllocations.id,id));
        await cleanupAutoTicket();
        return json(res,{ok:true,mode:"cancel_pending_allocation"});
      }

      if(row.status==="pending_return"){
        // Phiếu thu hồi vừa tạo thực chất đang giữ lại phiếu cấp phát đang hoạt động.
        // Khôi phục phiếu đó về active để xóa yêu cầu thu hồi mà không làm mất lịch sử cấp phát.
        if(String(row.allocationCode||"").startsWith("AP-RET-")){
          await db.delete(allocationLicenses).where(eq(allocationLicenses.allocationId,id));
          await db.delete(handoverRecords).where(eq(handoverRecords.allocationId,id));
          await db.delete(assetAllocations).where(eq(assetAllocations.id,id));
        } else {
          await db.update(assetAllocations).set({status:"active"}).where(eq(assetAllocations.id,id));
        }
        await cleanupAutoTicket();
        await db.update(assets).set({status:"in_use",assignedUserId:Number(row.userId)||null,userText:asset?.userText||null}).where(eq(assets.id,Number(row.assetId)));
        return json(res,{ok:true,mode:"cancel_pending_return"});
      }

      if(row.status==="active") {
        await restoreAllocationLicenses(db,id);
        await db.delete(allocationLicenses).where(eq(allocationLicenses.allocationId,id));
        await db.delete(handoverRecords).where(eq(handoverRecords.allocationId,id));
        await db.update(assets).set({status:"available",assignedUserId:null,userText:null,warehouseId:row.warehouseId||null}).where(eq(assets.id,Number(row.assetId)));
        await db.delete(assetAllocations).where(eq(assetAllocations.id,id));
        await cleanupAutoTicket();
        return json(res,{ok:true,mode:"delete_active"});
      }
      if(row.status==="returned") {
        await db.delete(handoverRecords).where(eq(handoverRecords.allocationId,id));
        await db.delete(allocationLicenses).where(eq(allocationLicenses.allocationId,id));
        await db.delete(assetAllocations).where(eq(assetAllocations.id,id));
        return json(res,{ok:true,mode:"delete_returned"});
      }
      if(!ticket || ticket.status!=="completed")return json(res,{message:"Phiếu không ở trạng thái có thể xóa."},409);
      await db.delete(handoverRecords).where(eq(handoverRecords.allocationId,id));
      await db.delete(allocationLicenses).where(eq(allocationLicenses.allocationId,id));
      await db.delete(assetAllocations).where(eq(assetAllocations.id,id));
      return json(res,{ok:true,mode:"delete_completed"});
    } catch(error:any){
      console.error("Allocation delete failed",error);
      return json(res,{message:error?.message||"Không thể xóa phiếu cấp phát/thu hồi."},400);
    }
  });

  app.patch("/api/asset/allocations/:id", async (req,res)=>{
    if (!(await requirePermission(req,res,"allocation","canEdit"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const id=Number(req.params.id); const row=(await db.select().from(assetAllocations).where(eq(assetAllocations.id,id)).limit(1))[0] as any;
      if(!row)return json(res,{message:"Không tìm thấy phiếu cấp phát/thu hồi."},404); const b=req.body||{}; const patch:any={};
      if(b.note!==undefined)patch.note=b.note?String(b.note).trim():null;
      if(b.warehouseId!==undefined){const warehouseId=b.warehouseId?Number(b.warehouseId):null;if(warehouseId){const wh=await db.select({id:inventoryWarehouses.id}).from(inventoryWarehouses).where(eq(inventoryWarehouses.id,warehouseId)).limit(1);if(!wh.length)return json(res,{message:"Kho lưu trữ không tồn tại."},400);}patch.warehouseId=warehouseId;}
      if(row.status!=="returned"){
        if(b.userText!==undefined){const userText=String(b.userText||"").trim();if(!userText)return bad(res,"Người nhận / người sử dụng là bắt buộc.");patch.userText=userText;patch.userId=null;}else if(b.userId!==undefined){const userId=Number(b.userId||0);if(!userId)return bad(res,"Người nhận / người sử dụng là bắt buộc.");const u=await db.select({id:assetUsers.id}).from(assetUsers).where(and(eq(assetUsers.id,userId),eq(assetUsers.active,1))).limit(1);if(!u.length)return json(res,{message:"Người sử dụng không tồn tại hoặc đã ngừng sử dụng."},400);patch.userId=userId;}
        for(const field of ["departmentId","locationId"])if(b[field]!==undefined)patch[field]=b[field]?Number(b[field]):null;
      }
      const hasLicensePatch=Array.isArray(b.licenseSelections);
      if(!Object.keys(patch).length&&!hasLicensePatch)return bad(res,"Không có nội dung cần cập nhật.");
      if(hasLicensePatch){if(!["pending_allocation","active"].includes(String(row.status)))return json(res,{message:"Chỉ phiếu cấp phát đang chờ hoặc đang sử dụng mới được cập nhật bản quyền đi kèm."},409);await restoreAllocationLicenses(db,id);await db.delete(allocationLicenses).where(eq(allocationLicenses.allocationId,id));await consumeAllocationLicenses(db,id,b.licenseSelections);}
      if(Object.keys(patch).length)await db.update(assetAllocations).set(patch).where(eq(assetAllocations.id,id));
      const next={...row,...patch};
      if(["pending_allocation","active"].includes(String(row.status))){const userId=Number(next.userId||row.userId||0);const u=userId?(await db.select({fullName:assetUsers.fullName}).from(assetUsers).where(eq(assetUsers.id,userId)).limit(1))[0]:null;const assignedName=next.userText||u?.fullName||null;await db.update(assets).set({userText:assignedName,assignedUserId:userId||null,departmentId:next.departmentId||null,locationId:next.locationId||null,warehouseId:row.status==="active"?null:(next.warehouseId??null)}).where(eq(assets.id,Number(row.assetId)));}
      if(row.status==="returned"&&b.warehouseId!==undefined)await db.update(assets).set({warehouseId:patch.warehouseId}).where(eq(assets.id,Number(row.assetId)));
      return json(res,{ok:true});
    } catch(error:any){console.error("Allocation update failed",error);return json(res,{message:error?.message||"Không thể chỉnh sửa phiếu cấp phát/thu hồi."},400);}
  });

  app.post("/api/asset/allocations/:id/complete", async (req,res)=>{
    if (!(await requirePermission(req,res,"allocation","canEdit"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const id=Number(req.params.id); const row=(await db.select().from(assetAllocations).where(eq(assetAllocations.id,id)).limit(1))[0] as any;
      if(!row)return json(res,{message:"Không tìm thấy phiếu."},404);
      const asset=(await db.select().from(assets).where(eq(assets.id,row.assetId)).limit(1))[0] as any;
      if(row.status==="pending_allocation"){
        const u=row.userId?(await db.select().from(assetUsers).where(eq(assetUsers.id,row.userId)).limit(1))[0] as any:null; const assignedName=row.userText||u?.fullName||asset?.userText||null;
        await db.update(assetAllocations).set({status:"active"}).where(eq(assetAllocations.id,id));
        await db.update(assets).set({status:"in_use",userText:assignedName,assignedUserId:row.userId||null,departmentId:row.departmentId||asset.departmentId,locationId:row.locationId||asset.locationId,warehouseId:null}).where(eq(assets.id,row.assetId));
        const code=`BB-BG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${row.assetId}`; await db.insert(handoverRecords).values({documentCode:code,assetId:row.assetId,allocationId:id,ticketId:row.ticketId||null,fromUserId:null,toUserId:row.userId||null,type:"handover",note:row.note||null});
        return json(res,{ok:true,status:"active"});
      }
      if(row.status==="pending_return"){
        await restoreAllocationLicenses(db,id);
        await db.update(assetAllocations).set({status:"returned",returnedAt:new Date()}).where(eq(assetAllocations.id,id));
        const previousUser=(await db.select({fullName:assetUsers.fullName}).from(assetUsers).where(eq(assetUsers.id,Number(row.userId))).limit(1))[0]?.fullName||asset?.userText||null;
        const returnNote=previousUser?`Người sử dụng trước khi thu hồi: ${previousUser}`:"";
        await db.update(assets).set({status:"available",warehouseId:row.warehouseId||null,userText:null,assignedUserId:null,note:appendAssetNote(asset?.note,returnNote)}).where(eq(assets.id,row.assetId));
        const code=`BB-TH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${row.assetId}`; await db.insert(handoverRecords).values({documentCode:code,assetId:row.assetId,allocationId:id,ticketId:row.ticketId||null,fromUserId:row.userId,toUserId:null,type:"return",note:row.note||null});
        return json(res,{ok:true,status:"returned"});
      }
      return json(res,{message:"Phiếu không ở trạng thái chờ xử lý."},409);
    } catch(error:any){console.error("Allocation complete failed",error);return json(res,{message:error?.message||"Không thể hoàn tất phiếu."},400);}
  });

  app.get("/api/asset/handover", async (req,res)=>{
    if (!(await requirePermission(req,res,"allocation","canView"))) return;
    const db=await getDb(); if(!db)return json(res,[]);
    try { const rows:any[]=await db.select().from(handoverRecords).orderBy(desc(handoverRecords.id)); const [assetsRows,allocRows,ticketRows]=await Promise.all([db.select().from(assets),db.select().from(assetAllocations),db.select().from(tickets)]); const amap=new Map(assetsRows.map((x:any)=>[Number(x.id),x])); const allocmap=new Map(allocRows.map((x:any)=>[Number(x.id),x])); const tmap=new Map(ticketRows.map((x:any)=>[Number(x.id),x])); return json(res,rows.map((r:any)=>({...r,assetName:amap.get(Number(r.assetId))?.name||"",assetCode:amap.get(Number(r.assetId))?.assetCode||"",allocationStatus:allocmap.get(Number(r.allocationId))?.status||"",ticketCode:tmap.get(Number(r.ticketId))?.ticketCode||""}))); } catch(error){ console.error("Handover list failed",error); return json(res,{message:"Không thể tải lịch sử biên bản."},500); }
  });

  app.delete("/api/asset/handover/:id", async (req,res)=>{ if(!(await requirePermission(req,res,"allocation","canDelete"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const id=Number(req.params.id); const row=(await db.select().from(handoverRecords).where(eq(handoverRecords.id,id)).limit(1))[0] as any; if(!row)return json(res,{message:"Không tìm thấy biên bản trong lịch sử."},404); await db.delete(handoverRecords).where(eq(handoverRecords.id,id)); return json(res,{ok:true}); } catch(error:any){ console.error("Handover history delete failed",error); return json(res,{message:error?.message||"Không thể xóa biên bản khỏi lịch sử."},400); } });

  app.patch("/api/asset/handover/:id", async (req,res)=>{ if(!(await requirePermission(req,res,"allocation","canEdit"))) return; const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const id=Number(req.params.id); const row=(await db.select().from(handoverRecords).where(eq(handoverRecords.id,id)).limit(1))[0] as any; if(!row)return json(res,{message:"Không tìm thấy biên bản trong lịch sử."},404); const patch:any={}; if(req.body?.documentCode!==undefined)patch.documentCode=String(req.body.documentCode||"").trim(); if(req.body?.note!==undefined)patch.note=req.body.note?String(req.body.note):null; if(req.body?.documentCode!==undefined&&!patch.documentCode)return bad(res,"Số biên bản không được để trống."); await db.update(handoverRecords).set(patch).where(eq(handoverRecords.id,id)); return json(res,{ok:true}); } catch(error:any){ console.error("Handover history update failed",error); return json(res,{message:error?.message||"Không thể chỉnh sửa biên bản."},400); } });

  app.get("/api/asset/allocation-templates", async (req,res)=>{ if(!(await requirePermission(req,res,"allocation","canView")))return; const db=await getDb(); if(!db)return json(res,[]); return json(res,await db.select().from(allocationTemplates).where(eq(allocationTemplates.active,1)).orderBy(allocationTemplates.type,allocationTemplates.id)); });
  app.patch("/api/asset/allocation-templates/:id", async (req,res)=>{ if(!(await requirePermission(req,res,"allocation","canEdit")))return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const b:any={}; for(const k of ["name","title","headerText","bodyText","footerText","active"])if(req.body?.[k]!==undefined)b[k]=k==="active"?Number(req.body[k])?1:0:req.body[k]; await db.update(allocationTemplates).set(b).where(eq(allocationTemplates.id,Number(req.params.id))); return json(res,{ok:true}); });

  app.post("/api/asset/upload", async (req: Request, res: Response) => {
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const {fileName,mimeType,data,entityType,entityId}=req.body||{};
    if(!fileName||!data)return bad(res,"Thiếu tệp tải lên");
    const base64=String(data).replace(/^data:[^;]+;base64,/,''); const buffer=Buffer.from(base64,"base64");
    if(buffer.length>50*1024*1024)return bad(res,"Tệp vượt quá 50 MB");
    const safeName=`${randomUUID()}-${path.basename(String(fileName)).replace(/[^a-zA-Z0-9._-]/g,"_")}`; await mkdir(uploadRoot,{recursive:true}); const full=path.join(uploadRoot,safeName); await writeFile(full,buffer);
    const [inserted] = await db.insert(attachmentFiles).values({fileName:String(fileName),mimeType:String(mimeType||"application/octet-stream"),size:buffer.length,storagePath:full,entityType:String(entityType||"general"),entityId:entityId?Number(entityId):null});
    const attachmentId = Number((inserted as any).insertId || 0);
    return json(res,{ok:true,id:attachmentId,fileName,storagePath:full,size:buffer.length,url:attachmentId?`/api/asset/files/${attachmentId}`:null},201);
  });

  app.get("/api/asset/files/:id", async (req,res)=>{ const db=await getDb(); if(!db)return res.status(500).end(); const rows=await db.select().from(attachmentFiles).where(eq(attachmentFiles.id,Number(req.params.id))).limit(1); const file=rows[0]; if(!file)return res.status(404).end(); res.setHeader("Content-Type",file.mimeType); res.setHeader("Content-Disposition",`inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`); return res.sendFile(file.storagePath); });

  app.get("/api/asset/settings", async (req,res)=>{if(!(await requirePermission(req,res,"settings","canView")))return;const db=await getDb();if(!db)return json(res,[]);try{return json(res,await db.select().from(systemSettings));}catch(error){console.error("Settings table read failed",error);return json(res,{message:"Không thể đọc bảng systemSettings. Hãy chạy cập nhật database v9."},500);}});
  app.patch("/api/asset/settings/:key", async (req,res)=>{if(!(await requirePermission(req,res,"settings","canEdit")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");try{const key=req.params.key;await db.update(systemSettings).set({settingValue:String(req.body?.value??"")}).where(eq(systemSettings.settingKey,key));return json(res,{ok:true});}catch(error){console.error("Settings update failed",error);return json(res,{message:"Không thể cập nhật systemSettings."},500);}});
  app.get("/api/asset/permissions", async (req,res)=>{if(!(await requirePermission(req,res,"settings","canView")))return;const db=await getDb();if(!db)return json(res,[]);try{return json(res,await db.select().from(permissionRules));}catch(error){console.error("Permission table read failed",error);return json(res,{message:"Không thể đọc bảng permissionRules. Hãy chạy cập nhật database v9."},500);}});
  app.patch("/api/asset/permissions/:id", async (req,res)=>{if(!(await requirePermission(req,res,"settings","canEdit")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");try{await db.update(permissionRules).set(req.body).where(eq(permissionRules.id,Number(req.params.id)));return json(res,{ok:true});}catch(error){console.error("Permission update failed",error);return json(res,{message:"Không thể cập nhật permissionRules."},500);}});
  app.get("/api/asset/inventory-checks", async (req,res)=>{ if(!(await requirePermission(req,res,"inventory-check","canView"))) return; const db=await getDb(); if(!db)return json(res,[]); return json(res,await db.select().from(inventoryChecks).orderBy(desc(inventoryChecks.id))); });
  app.post("/api/asset/inventory-checks", async (req,res)=>{ if(!(await requirePermission(req,res,"inventory-check","canCreate"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const b=req.body||{}; const code=b.checkCode||`KK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`; const r=await db.insert(inventoryChecks).values({checkCode:code,departmentId:b.departmentId?Number(b.departmentId):null,locationId:b.locationId?Number(b.locationId):null,checkedById:b.checkedById?Number(b.checkedById):null,status:"in_progress",note:b.note||null}); const id=Number((r as any).insertId||0); const items=Array.isArray(b.items)?b.items:[]; if(id&&items.length) await db.insert(inventoryCheckItems).values(items.map((x:any)=>({inventoryCheckId:id,assetId:Number(x.assetId),expectedStatus:x.expectedStatus||null,actualStatus:x.actualStatus||null,found:x.found?1:0,note:x.note||null}))); return json(res,{ok:true,id,checkCode:code},201); });
  app.patch("/api/asset/inventory-checks/:id", async (req,res)=>{ if(!(await requirePermission(req,res,"inventory-check","canEdit"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); const body={...req.body}; if(body.status==="completed")body.completedAt=new Date(); await db.update(inventoryChecks).set(body).where(eq(inventoryChecks.id,Number(req.params.id))); return json(res,{ok:true}); });
  app.get("/api/asset/inventory-checks/:id/items", async (req,res)=>{ if(!(await requirePermission(req,res,"inventory-check","canView"))) return; const db=await getDb(); if(!db)return json(res,[]); return json(res,await db.select().from(inventoryCheckItems).where(eq(inventoryCheckItems.inventoryCheckId,Number(req.params.id)))); });

  const moduleCrud = (route:string, table:any, module:string, fields:string[], hooks?:{afterRead?:(db:any,id:number)=>Promise<void>;afterWrite?:(db:any,id:number)=>Promise<void>;afterDelete?:(db:any,id:number,old:any)=>Promise<void>}) => {
    app.get(`/api/asset/${route}`, async (req,res)=>{ if(!(await requirePermission(req,res,module,"canView"))) return; const db=await getDb(); if(!db)return json(res,[]); try { const q=String(req.query.q||"").trim(); const status=String(req.query.status||"").trim(); const conditions:any[]=[]; if(status && table.status) conditions.push(eq(table.status,status)); if(q){const searchable=fields.filter(f=>["licenseCode","productName","vendor","deviceCode","name","deviceType","ipAddress","macAddress","specifications"].includes(f)).map(f=>like(table[f],`%${q}%`)); if(searchable.length)conditions.push(or(...searchable));} const rows:any[]=await db.select().from(table).where(conditions.length?and(...conditions):undefined).orderBy(desc(table.id)); if(hooks?.afterRead) await Promise.all(rows.map((r:any)=>hooks.afterRead!(db,Number(r.id)))); return json(res,rows); } catch(error){console.error(`Module ${route} GET failed`,error);return json(res,{message:`Không thể tải dữ liệu ${route}.`},500);} });
    app.post(`/api/asset/${route}`, async (req,res)=>{ if(!(await requirePermission(req,res,module,"canCreate"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const values:any={}; for(const f of fields) values[f]=req.body?.[f]??null; const result:any=await db.insert(table).values(values); const id=Number(result.insertId||0); if(id&&hooks?.afterWrite) await hooks.afterWrite(db,id); return json(res,{ok:true,id},201); } catch(error){console.error(`Module ${route} POST failed`,error);return json(res,{message:`Không thể thêm dữ liệu ${route}.`},500);} });
    app.patch(`/api/asset/${route}/:id`, async (req,res)=>{ if(!(await requirePermission(req,res,module,"canEdit"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const patch:any={}; for(const f of fields) if(req.body?.[f]!==undefined) patch[f]=req.body[f]; await db.update(table).set(patch).where(eq(table.id,Number(req.params.id))); if(hooks?.afterWrite) await hooks.afterWrite(db,Number(req.params.id)); return json(res,{ok:true}); } catch(error){console.error(`Module ${route} PATCH failed`,error);return json(res,{message:`Không thể cập nhật dữ liệu ${route}.`},500);} });
    app.delete(`/api/asset/${route}/:id`, async (req,res)=>{ if(!(await requirePermission(req,res,module,"canDelete"))) return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const id=Number(req.params.id); const oldRows:any[]=await db.select().from(table).where(eq(table.id,id)).limit(1); await db.delete(table).where(eq(table.id,id)); if(hooks?.afterDelete) await hooks.afterDelete(db,id,oldRows[0]); return json(res,{ok:true}); } catch(error){console.error(`Module ${route} DELETE failed`,error);return json(res,{message:`Không thể xóa dữ liệu ${route}.`},500);} });
  };
  moduleCrud("licenses", licenses, "licenses", ["licenseCode","productName","vendor","licenseType","quantity","usedQuantity","expiryDate","status","note","warehouseId"], {afterRead:syncLicenseToSources, afterWrite:syncLicenseToSources, afterDelete:async(db,id,old)=>{if(old){const code=`LIC-${old.licenseCode}`; await db.update(assets).set({status:"retired"}).where(eq(assets.assetCode,code)); await db.update(inventoryItems).set({quantity:0}).where(eq(inventoryItems.itemCode,code));}}});

  app.get("/api/asset/network", async (req,res)=>{
    if(!(await requireAnyPermission(req,res,["network","maintenance"],"canView")))return;
    const db=await getDb(); if(!db)return json(res,[]);
    try {
      const q=String(req.query.q||"").trim(); const status=String(req.query.status||"").trim();
      const conditions:any[]=[];
      if(status) conditions.push(eq(networkDevices.status,status as any));
      if(q) conditions.push(or(like(networkDevices.deviceCode,`%${q}%`),like(networkDevices.name,`%${q}%`),like(networkDevices.deviceType,`%${q}%`),like(networkDevices.ipAddress,`%${q}%`),like(networkDevices.note,`%${q}%`)));
      const rows:any[]=await db.select().from(networkDevices).where(conditions.length?and(...conditions):undefined).orderBy(desc(networkDevices.id));
      await Promise.all(rows.map((r:any)=>syncNetworkDeviceToAsset(db,Number(r.id))));
      // Legacy deployments sometimes stored network equipment only in assets, not networkDevices.
      // Expose those records as selectable maintenance targets without modifying or duplicating MySQL data.
      const [legacyAssets,categoryRows]=await Promise.all([db.select().from(assets),db.select().from(assetCategories)]);
      const categoryNames=new Map(categoryRows.map((c:any)=>[Number(c.id),String(c.name||"")] as [number,string]));
      const infraPattern=/(network|hạ tầng|mạng|switch|router|firewall|wifi|wi-?fi|access.?point|synology|nas|server|máy chủ|tủ rack|rack|modem|gateway|cisco|unifi|ups|load.?balancer)/i;
      const existingCodes=new Set(rows.map((r:any)=>String(r.deviceCode||"").toLowerCase()));
      const legacy=String(req.query.includeLegacy||"")==="1"?legacyAssets.filter((a:any)=>{
        if(a.status==="retired"||String(a.assetCode||"").startsWith("NET-")||existingCodes.has(String(a.assetCode||"").toLowerCase()))return false;
        const cat=categoryNames.get(Number(a.categoryId))||"";if(!infraPattern.test(`${cat} ${a.name||""} ${a.assetCode||""}`))return false;
        const haystack=`${a.assetCode||""} ${a.name||""} ${cat} ${a.serialNumber||""} ${a.note||""}`.toLowerCase();if(q&&!haystack.includes(q.toLowerCase()))return false;
        if(status){const expected=status==="active"? ["available","in_use","pending_allocation"].includes(a.status):status==="maintenance"?a.status==="repair":status==="offline"?a.status==="damaged":status==="retired"?a.status==="retired":true;if(!expected)return false;}
        return true;
      }).map((a:any)=>({id:-Number(a.id),legacyAssetId:Number(a.id),deviceCode:String(a.assetCode||`ASSET-${a.id}`),name:String(a.name||"Thiết bị hạ tầng"),deviceType:categoryNames.get(Number(a.categoryId))||"Hạ tầng & Mạng",ipAddress:null,locationId:a.locationId||null,status:a.status==="repair"?"maintenance":a.status==="damaged"?"offline":"active",specifications:a.specifications||null,note:a.note||null,updatedAt:a.updatedAt||a.createdAt||null})) : [];
      const maint:any[]=await db.select().from(maintenanceRecords).orderBy(desc(maintenanceRecords.id));
      const ticketRows:any[]=await db.select().from(tickets);
      const latest=new Map<number,any>(); for(const m of maint){const id=Number(m.networkDeviceId);if(id&&!latest.has(id))latest.set(id,m);}
      const current=rows.map(r=>{const m=latest.get(Number(r.id));const t=m?.ticketId?ticketRows.find((x:any)=>Number(x.id)===Number(m.ticketId)):null;return {...r,maintenanceId:m?.id||null,maintenanceStatus:m?.status||null,maintenanceIssue:m?.issue||null,ticketCode:t?.ticketCode||null,ticketTitle:t?.title||null};});
      return json(res,[...current,...legacy]);
    } catch(error){console.error("Network GET failed",error);return json(res,{message:"Không thể tải dữ liệu hạ tầng & mạng."},500);}
  });
  app.post("/api/asset/network", async (req,res)=>{if(!(await requirePermission(req,res,"network","canCreate")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");try{const b=req.body||{};if(!b.deviceCode||!b.name)return bad(res,"Mã và tên thiết bị là bắt buộc");const result:any=await db.insert(networkDevices).values({deviceCode:String(b.deviceCode),name:String(b.name),deviceType:b.deviceType||null,ipAddress:b.ipAddress||null,locationId:b.locationId?Number(b.locationId):null,status:b.status||"active",specifications:b.specifications||null,note:b.note||null});const id=Number(result.insertId||0);if(id)await syncNetworkDeviceToAsset(db,id);return json(res,{ok:true,id},201);}catch(error){console.error("Network POST failed",error);return json(res,{message:"Không thể thêm thiết bị hạ tầng & mạng."},500);}});
  app.patch("/api/asset/network/:id", async (req,res)=>{if(!(await requirePermission(req,res,"network","canEdit")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");try{const b:any={...req.body};delete b.macAddress;const allowed:any={};for(const k of ["deviceCode","name","deviceType","ipAddress","locationId","status","specifications","note"])if(b[k]!==undefined)allowed[k]=b[k];if(allowed.locationId!==undefined)allowed.locationId=allowed.locationId?Number(allowed.locationId):null;await db.update(networkDevices).set(allowed).where(eq(networkDevices.id,Number(req.params.id)));await syncNetworkDeviceToAsset(db,Number(req.params.id));return json(res,{ok:true});}catch(error){console.error("Network PATCH failed",error);return json(res,{message:"Không thể cập nhật thiết bị hạ tầng & mạng."},500);}});
  app.delete("/api/asset/network/:id", async (req,res)=>{if(!(await requirePermission(req,res,"network","canDelete")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");try{const id=Number(req.params.id);const old:any[] = await db.select().from(networkDevices).where(eq(networkDevices.id,id)).limit(1);await db.delete(networkDevices).where(eq(networkDevices.id,id));if(old[0])await db.update(assets).set({status:"retired",note:`Thiết bị hạ tầng ${old[0].deviceCode} đã xóa khỏi nguồn Hạ tầng & Mạng.`}).where(eq(assets.assetCode,`NET-${old[0].deviceCode}`));return json(res,{ok:true});}catch(error){console.error("Network DELETE failed",error);return json(res,{message:"Không thể xóa thiết bị hạ tầng & mạng."},500);}});
  app.get("/api/asset/handover-documents", async (req,res)=>{ if(!(await requirePermission(req,res,"allocation","canView"))) return; const db=await getDb(); if(!db)return json(res,[]); return json(res,await db.select().from(handoverDocuments).orderBy(desc(handoverDocuments.id))); });

  // Helpdesk persistence: UI giữ nguyên nhưng dữ liệu được lưu MySQL.
  app.patch("/api/helpdesk/tickets/:code/updates/:updateId", async (req,res)=>{
    const session=await requireAdminConsole(req,res); if(!session)return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const note=String(req.body?.note||"").trim();
      if(!note)return bad(res,"Ghi chú sau khi hoàn tất không được để trống.");
      const rows=await db.select().from(ticketUpdates).where(eq(ticketUpdates.id,Number(req.params.updateId))).limit(1);
      if(!rows[0])return json(res,{message:"Không tìm thấy nội dung cập nhật."},404);
      const ticketRows=await db.select({id:tickets.id,ticketCode:tickets.ticketCode}).from(tickets).where(eq(tickets.ticketCode,String(req.params.code))).limit(1);
      if(!ticketRows[0]||Number(rows[0].ticketId)!==Number(ticketRows[0].id))return json(res,{message:"Nội dung cập nhật không thuộc ticket này."},400);
      await db.update(ticketUpdates).set({note}).where(eq(ticketUpdates.id,Number(req.params.updateId)));
      return json(res,{ok:true});
    } catch(error){console.error("Helpdesk history edit failed",error);return json(res,{message:"Không thể chỉnh sửa nội dung xử lý."},500);}
  });
  app.get("/api/helpdesk/tickets", async (req,res)=>{ if(!(await requireAnyPermission(req,res,["helpdesk","maintenance"],"canView")))return; const db=await getDb(); if(!db)return json(res,[]); try { const status=String(req.query.status||"").trim(); const priority=String(req.query.priority||"").trim(); const q=String(req.query.q||"").trim(); const departmentId=req.query.departmentId?Number(req.query.departmentId):null; const locationId=req.query.locationId?Number(req.query.locationId):null; const conditions:any[]=[]; if(status)conditions.push(eq(tickets.status,status as any)); if(priority)conditions.push(eq(tickets.priority,priority as any)); if(departmentId)conditions.push(eq(tickets.departmentId,departmentId)); if(locationId)conditions.push(eq(tickets.locationId,locationId)); if(q)conditions.push(or(like(tickets.ticketCode,`%${q}%`),like(tickets.title,`%${q}%`),like(tickets.description,`%${q}%`))); const [rows,updates,allocs,deptRows,locRows]=await Promise.all([db.select().from(tickets).where(conditions.length?and(...conditions):undefined).orderBy(desc(tickets.id)),db.select().from(ticketUpdates),db.select().from(assetAllocations),db.select().from(departments),db.select().from(locations)]); const dmap=new Map(deptRows.map((x:any)=>[Number(x.id),x.name])); const lmap=new Map(locRows.map((x:any)=>[Number(x.id),x.name])); return json(res,rows.map((t:any)=>{const related=allocs.filter((a:any)=>Number(a.ticketId)===Number(t.id)); const workflow=related.length?related.sort((a:any,b:any)=>Number(b.id)-Number(a.id))[0]:null; return {id:t.ticketCode,title:t.title,description:t.description||"",requester:"Người dùng nội bộ",department:dmap.get(Number(t.departmentId))||"Chưa cập nhật",departmentId:t.departmentId||null,location:lmap.get(Number(t.locationId))||"Chưa cập nhật",locationId:t.locationId||null,assetId:t.assetId||null,allocationWorkflow:workflow?{id:workflow.id,status:workflow.status,allocationCode:workflow.allocationCode,warehouseId:workflow.warehouseId||null}:null,priority:({low:"Thấp",medium:"Trung bình",high:"Cao"} as any)[t.priority]||"Trung bình",status:({new:"Mới",in_progress:"Đang xử lý",waiting_user:"Đang xử lý",completed:"Đã hoàn thành"} as any)[t.status]||"Mới",assignee:"Chưa phân công",createdAt:t.createdAt,updatedAt:t.updatedAt,history:updates.filter((u:any)=>Number(u.ticketId)===Number(t.id)).map((u:any)=>({updateId:Number(u.id),authorId:u.authorId||null,status:({new:"Mới",in_progress:"Đang xử lý",waiting_user:"Đang xử lý",completed:"Đã hoàn thành"} as any)[u.status]||"Mới",note:u.note||"",assetStatusAfter:u.assetStatusAfter||null,at:u.createdAt,attachments:[]})),attachments:[]};})); } catch(error){console.error("Helpdesk query failed",error);return json(res,{message:"Không thể tải danh sách Helpdesk."},500);} });
  app.post("/api/helpdesk/tickets", async (req,res)=>{ if(!(await requirePermission(req,res,"helpdesk","canCreate")))return; const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình"); try { const b=req.body||{}; const code=b.ticketCode||`HD-${String(Date.now()).slice(-6)}`; const priorityMap:any={"Thấp":"low","Trung bình":"medium","Cao":"high"}; const priority=priorityMap[b.priority]||"medium"; const assetId=b.assetId?Number(b.assetId):null; let departmentId=b.departmentId?Number(b.departmentId):null; let locationId=b.locationId?Number(b.locationId):null; if(assetId){const ar=await db.select({departmentId:assets.departmentId,locationId:assets.locationId}).from(assets).where(eq(assets.id,assetId)).limit(1); if(ar[0]){if(!departmentId)departmentId=ar[0].departmentId||null;if(!locationId)locationId=ar[0].locationId||null;}} const r=await db.insert(tickets).values({ticketCode:code,title:String(b.title),description:String(b.description||""),priority,status:"new",assetId,departmentId,locationId}); const id=Number((r as any).insertId||0); if(id){ const session=await getSession(req); await db.insert(ticketUpdates).values({ticketId:id,authorId:session?.id||null,status:"new",note:"Ticket được tạo từ Helpdesk."}); } return json(res,{ok:true,ticketCode:code},201); } catch(error){console.error("Helpdesk create failed",error);return json(res,{message:"Không thể tạo ticket."},500);} });
  app.patch("/api/helpdesk/tickets/:code", async (req,res)=>{
    const session=await requirePermission(req,res,"helpdesk","canEdit"); if(!session)return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try {
      const rows=await db.select().from(tickets).where(eq(tickets.ticketCode,String(req.params.code))).limit(1);
      if(!rows[0])return json(res,{message:"Không tìm thấy ticket."},404);
      const current:any=rows[0];
      const b=req.body||{};
      const statusMap:any={"Mới":"new","Đang xử lý":"in_progress","Chờ người dùng":"waiting_user","Đã hoàn thành":"completed","Đã hoàn tất":"completed","Hoàn thành":"completed","Hoàn tất":"completed","Đã xong":"completed"};
      const status=statusMap[b.status]||b.status||current.status;
      const isAdmin=session.role==="administrator"||session.role==="admin";
      if(current.status==="completed"&&!isAdmin)return json(res,{message:"Ticket đã hoàn tất. Ghi chú và lịch sử xử lý đã được khóa; chỉ admin/administrator mới được chỉnh sửa."},403);
      const note=String(b.note||"").trim();
      if(status==="completed"&&!note)return bad(res,"Bắt buộc nhập ghi chú xử lý hoặc nội dung cập nhật trước khi đóng ticket.");
      const patch:any={status,assetId:b.assetId!==undefined?(b.assetId?Number(b.assetId):null):current.assetId,departmentId:b.departmentId!==undefined?(b.departmentId?Number(b.departmentId):null):current.departmentId,locationId:b.locationId!==undefined?(b.locationId?Number(b.locationId):null):current.locationId};
      await db.update(tickets).set(patch).where(eq(tickets.id,current.id));
      let effectiveAssetStatus:any=null;
      if(current.assetId){
        const ar:any[]=await db.select().from(assets).where(eq(assets.id,Number(current.assetId))).limit(1);
        effectiveAssetStatus=ar[0]?.status||null;
      }
      const rawAssetStatus=b.assetStatus??b.assetStatusAfter;
      const requestedAssetStatus=rawAssetStatus&&rawAssetStatus!=="keep"?String(rawAssetStatus):null;
      if(status==="completed"&&current.assetId&&requestedAssetStatus){
        const allowed=["in_use","available","pending_allocation","pending_return","repair","damaged","retired"];
        if(allowed.includes(requestedAssetStatus)){
          effectiveAssetStatus=requestedAssetStatus;
          await db.update(assets).set({status:requestedAssetStatus as any,assignedUserId:requestedAssetStatus==="in_use"?(current.assigneeId||null):null}).where(eq(assets.id,Number(current.assetId)));
        }
      }
      // Đồng bộ trạng thái tài sản từ trường “Trạng thái tài sản sau ticket”
      // cho hồ sơ bảo trì/sửa chữa liên kết với ticket này.
      if(status==="completed"){
        const linkedMaintenance:any[]=await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.ticketId,Number(current.id)));
        const maintenanceFinalStatus=requestedAssetStatus || "available";
        const maintenanceAllowed=["in_use","available","pending_allocation","pending_return","repair","damaged","retired"];
        const safeMaintenanceStatus=maintenanceAllowed.includes(maintenanceFinalStatus)?maintenanceFinalStatus:"available";
        for(const record of linkedMaintenance){
          if(Number(record.assetId)>0){
            const assetPatch:any={status:safeMaintenanceStatus};
            if(safeMaintenanceStatus!=="in_use")assetPatch.assignedUserId=null;
            await db.update(assets).set(assetPatch).where(eq(assets.id,Number(record.assetId)));
          }
          if(Number(record.networkDeviceId)>0){
            await db.update(networkDevices).set({status:safeMaintenanceStatus==="repair"?"maintenance":safeMaintenanceStatus==="damaged"||safeMaintenanceStatus==="retired"?"offline":"active"}).where(eq(networkDevices.id,Number(record.networkDeviceId)));
          }
          await db.update(maintenanceRecords).set({status:"completed",closedAt:new Date()}).where(eq(maintenanceRecords.id,Number(record.id)));
        }
      }
      const linked:any[]=await db.select().from(assetAllocations).where(eq(assetAllocations.ticketId,current.id));
      const pending=linked.filter((row:any)=>["pending_allocation","pending_return"].includes(String(row.status)));
      if(status==="completed"){
        const selectedFinalStatus=String(requestedAssetStatus||"").trim();
        for(const row of pending){
          const rowAsset:any=(await db.select().from(assets).where(eq(assets.id,row.assetId)).limit(1))[0]||{};
          if(row.status==="pending_allocation"){
            const finalForAllocation=selectedFinalStatus||"in_use";
            if(finalForAllocation==="in_use"){
              await db.update(assetAllocations).set({status:"active"}).where(eq(assetAllocations.id,row.id));
              const u=row.userId?(await db.select().from(assetUsers).where(eq(assetUsers.id,row.userId)).limit(1))[0] as any:null; const assignedName=row.userText||u?.fullName||rowAsset.userText||null;
              await db.update(assets).set({status:"in_use",assignedUserId:row.userId||null,userText:assignedName,departmentId:row.departmentId||current.departmentId||rowAsset.departmentId||null,locationId:row.locationId||current.locationId||rowAsset.locationId||null,warehouseId:null}).where(eq(assets.id,row.assetId));
              // Chuyển yêu cầu cấp phát đã hoàn tất sang lịch sử biên bản; kiểm tra trước để tránh tạo trùng.
              const existingHandover=await db.select({id:handoverRecords.id}).from(handoverRecords).where(and(eq(handoverRecords.allocationId,Number(row.id)),eq(handoverRecords.type,"handover"))).limit(1);
              if(!existingHandover.length){
                const handoverCode=`BB-BG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${row.assetId}`;
                await db.insert(handoverRecords).values({documentCode:handoverCode,assetId:row.assetId,allocationId:row.id,ticketId:current.id,fromUserId:null,toUserId:row.userId||null,type:"handover",note:row.note||note||null});
              }
            } else {
              await restoreAllocationLicenses(db,Number(row.id));
              await db.update(assetAllocations).set({status:"cancelled"}).where(eq(assetAllocations.id,row.id));
              const allowedAfter=["available","repair","damaged","pending_allocation","pending_return"];
              const finalStatus=allowedAfter.includes(finalForAllocation)?finalForAllocation:"available";
              await db.update(assets).set({status:finalStatus as any,assignedUserId:null,userText:null}).where(eq(assets.id,row.assetId));
            }
          } else {
            await restoreAllocationLicenses(db,Number(row.id));
            await db.update(assetAllocations).set({status:"returned",returnedAt:new Date()}).where(eq(assetAllocations.id,row.id));
            const allowedAfter=["available","in_use","repair","damaged","pending_return"];
            const finalStatus=allowedAfter.includes(selectedFinalStatus)?selectedFinalStatus:"available";
            const u=finalStatus==="in_use"?(await db.select().from(assetUsers).where(eq(assetUsers.id,row.userId)).limit(1))[0] as any:null;
            const previousUser=(await db.select({fullName:assetUsers.fullName}).from(assetUsers).where(eq(assetUsers.id,Number(row.userId))).limit(1))[0]?.fullName||rowAsset.userText||null;
            const returnNote=previousUser?`Người sử dụng trước khi thu hồi: ${previousUser}`:"";
            await db.update(assets).set({status:finalStatus as any,assignedUserId:finalStatus==="in_use"?row.userId:null,userText:finalStatus==="in_use"?(u?.fullName||rowAsset.userText||null):null,warehouseId:finalStatus==="in_use"?null:(row.warehouseId||null),note:appendAssetNote(rowAsset.note,returnNote)}).where(eq(assets.id,row.assetId));
            const existingReturnDoc=await db.select({id:handoverRecords.id}).from(handoverRecords).where(and(eq(handoverRecords.allocationId,row.id),eq(handoverRecords.type,"return"))).limit(1);
            if(!existingReturnDoc.length){
              const code=`BB-TH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${row.assetId}`;
              await db.insert(handoverRecords).values({documentCode:code,assetId:row.assetId,allocationId:row.id,ticketId:current.id,fromUserId:row.userId,toUserId:null,type:"return",note:row.note||null});
            }
          }
        }
      }
      if(current.assetId){
        const ar:any[]=await db.select({status:assets.status}).from(assets).where(eq(assets.id,Number(current.assetId))).limit(1);
        effectiveAssetStatus=ar[0]?.status||effectiveAssetStatus;
      }
      const finalStatus=effectiveAssetStatus||requestedAssetStatus||null;
      await db.insert(ticketUpdates).values({ticketId:current.id,authorId:session.id,status,note:note||`Cập nhật trạng thái: ${b.status||status}`,assetStatusAfter:finalStatus});
      return json(res,{ok:true,status,assetStatusAfter:finalStatus});
    } catch(error){console.error("Helpdesk update failed",error);return json(res,{message:"Không thể cập nhật ticket."},500);} 
  });

  app.delete("/api/helpdesk/tickets/:code", async (req,res)=>{
    if(!(await requirePermission(req,res,"helpdesk","canDelete")))return;
    const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try{
      const code=String(req.params.code||"");
      const current:any=(await db.select().from(tickets).where(eq(tickets.ticketCode,code)).limit(1))[0];
      if(!current)return json(res,{message:"Không tìm thấy ticket."},404);
      await db.delete(ticketUpdates).where(eq(ticketUpdates.ticketId,Number(current.id)));
      await db.update(assetAllocations).set({ticketId:null}).where(eq(assetAllocations.ticketId,Number(current.id)));
      await db.update(maintenanceRecords).set({ticketId:null}).where(eq(maintenanceRecords.ticketId,Number(current.id)));
      await db.update(handoverRecords).set({ticketId:null}).where(eq(handoverRecords.ticketId,Number(current.id)));
      await db.delete(attachmentFiles).where(and(eq(attachmentFiles.entityType,"ticket"),eq(attachmentFiles.entityId,Number(current.id))));
      await db.delete(tickets).where(eq(tickets.id,Number(current.id)));
      return json(res,{ok:true});
    }catch(error:any){console.error("Helpdesk DELETE failed",error);return json(res,{message:error?.message||"Không thể xóa ticket."},400);}
  });

  app.get("/api/reports/data", async (req,res)=>{if(!(await requirePermission(req,res,"reports","canView")))return;const db=await getDb();if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");try{const type=String(req.query.type||"tong-tai-san");const q=String(req.query.q||"").trim();const departmentId=req.query.departmentId?Number(req.query.departmentId):null;const locationId=req.query.locationId?Number(req.query.locationId):null;const categoryId=req.query.categoryId?Number(req.query.categoryId):null;const status=String(req.query.status||"").trim();const user=String(req.query.user||"").trim();const cond:any[]=[];if(departmentId)cond.push(eq(assets.departmentId,departmentId));if(locationId)cond.push(eq(assets.locationId,locationId));if(categoryId)cond.push(eq(assets.categoryId,categoryId));if(status)cond.push(eq(assets.status,status as any));if(user)cond.push(like(assets.userText,`%${user}%`));if(q)cond.push(or(like(assets.name,`%${q}%`),like(assets.assetCode,`%${q}%`),like(assets.serialNumber,`%${q}%`),like(assets.userText,`%${q}%`)));const assetRows:any[]=await db.select().from(assets).where(cond.length?and(...cond):undefined).orderBy(desc(assets.id));const [deptRows,locRows,catRows]=await Promise.all([db.select().from(departments),db.select().from(locations),db.select().from(assetCategories)]);const dmap=new Map(deptRows.map((x:any)=>[Number(x.id),x.name]));const lmap=new Map(locRows.map((x:any)=>[Number(x.id),x.name]));const cmap=new Map(catRows.map((x:any)=>[Number(x.id),x.name]));const sm:any={in_use:"Đang sử dụng",available:"Sẵn sàng cấp phát",pending_allocation:"Sẵn sàng cấp phát",pending_return:"Chờ thu hồi",repair:"Đang sửa chữa",damaged:"Hư hỏng - chờ thanh lý",retired:"Đã thanh lý"};const rows=assetRows.map((a:any)=>({id:a.id,assetCode:a.assetCode,name:a.name,category:cmap.get(Number(a.categoryId))||"",department:dmap.get(Number(a.departmentId))||"Chưa phân phòng ban",location:lmap.get(Number(a.locationId))||"",userText:a.userText||"",serialNumber:a.serialNumber||"",status:sm[a.status]||a.status,note:a.note||""}));if(type==="theo-phong-ban"){const grouped=new Map<string,any>();for(const r of rows){if(!grouped.has(r.department))grouped.set(r.department,{department:r.department,total:0,in_use:0,available:0,repair:0,damaged:0});const g=grouped.get(r.department);g.total++;if(r.status==="Đang sử dụng")g.in_use++;if(r.status==="Sẵn sàng cấp phát")g.available++;if(r.status==="Đang sửa chữa")g.repair++;if(r.status==="Hư hỏng - chờ thanh lý")g.damaged++;}return json(res,{type,rows:Array.from(grouped.values()),summary:{total:rows.length}});}if(type==="hu-hong-sua-chua")return json(res,{type,rows:rows.filter((r:any)=>["Đang sửa chữa","Hư hỏng - chờ thanh lý"].includes(r.status)),summary:{total:rows.filter((r:any)=>["Đang sửa chữa","Hư hỏng - chờ thanh lý"].includes(r.status)).length}});return json(res,{type,rows,summary:{total:rows.length}});}catch(error){console.error("Report data failed",error);return json(res,{message:"Không thể tải dữ liệu báo cáo."},500);}});

  app.get("/api/reports/templates", async (req,res)=>{
    if(!(await requirePermission(req,res,"reports","canView"))) return;
    const db=await getDb(); if(!db)return json(res,[]);
    try { return json(res,await db.select().from(reportTemplates).where(eq(reportTemplates.active,1)).orderBy(desc(reportTemplates.id))); }
    catch(error){console.error("Report templates GET failed",error);return json(res,{message:"Không thể tải danh sách biểu mẫu báo cáo."},500);}
  });
  app.post("/api/reports/templates", async (req,res)=>{
    if(!(await requirePermission(req,res,"reports","canCreate"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try { const b=req.body||{}; if(!b.title||!b.fileName||!b.storagePath)return bad(res,"Tên biểu mẫu, tên file và đường dẫn lưu là bắt buộc"); const result:any=await db.insert(reportTemplates).values({title:String(b.title),departmentId:b.departmentId?Number(b.departmentId):null,locationId:b.locationId?Number(b.locationId):null,fileName:String(b.fileName),mimeType:String(b.mimeType||"application/octet-stream"),storagePath:String(b.storagePath),note:b.note||null,active:1}); return json(res,{ok:true,id:Number(result.insertId||0)},201); }
    catch(error){console.error("Report template POST failed",error);return json(res,{message:"Không thể lưu biểu mẫu báo cáo."},500);}
  });
  app.delete("/api/reports/templates/:id", async (req,res)=>{
    if(!(await requirePermission(req,res,"reports","canDelete"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    try { await db.update(reportTemplates).set({active:0}).where(eq(reportTemplates.id,Number(req.params.id))); return json(res,{ok:true}); }
    catch(error){console.error("Report template DELETE failed",error);return json(res,{message:"Không thể xóa biểu mẫu báo cáo."},500);}
  });
  app.get("/api/reports/templates/:id/file", async (req,res)=>{
    if(!(await requirePermission(req,res,"reports","canView"))) return;
    const db=await getDb(); if(!db)return res.status(500).end();
    try { const rows:any[]=await db.select().from(reportTemplates).where(eq(reportTemplates.id,Number(req.params.id))).limit(1); const file=rows[0]; if(!file||!file.active)return res.status(404).end(); res.setHeader("Content-Type",file.mimeType); res.setHeader("Content-Disposition",`attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`); return res.sendFile(file.storagePath); }
    catch(error){console.error("Report template file failed",error);return res.status(404).end();}
  });

  app.get("/api/reports/assets.xls", async (req,res)=>{
    if (!(await requirePermission(req,res,"reports","canView"))) return;
    const db=await getDb(); if(!db)return bad(res,"DATABASE_URL chưa được cấu hình");
    const q=String(req.query.q||"").trim(); const departmentId=req.query.departmentId?Number(req.query.departmentId):null; const locationId=req.query.locationId?Number(req.query.locationId):null; const categoryId=req.query.categoryId?Number(req.query.categoryId):null; const status=String(req.query.status||"").trim(); const user=String(req.query.user||"").trim(); const exportCond:any[]=[]; if(departmentId)exportCond.push(eq(assets.departmentId,departmentId)); if(locationId)exportCond.push(eq(assets.locationId,locationId)); if(categoryId)exportCond.push(eq(assets.categoryId,categoryId)); if(status)exportCond.push(eq(assets.status,status as any)); if(user)exportCond.push(like(assets.userText,`%${user}%`)); if(q)exportCond.push(or(like(assets.name,`%${q}%`),like(assets.assetCode,`%${q}%`),like(assets.serialNumber,`%${q}%`),like(assets.userText,`%${q}%`)));
    const [assetRows,deptRows,catRows,templateRows]=await Promise.all([db.select().from(assets).where(exportCond.length?and(...exportCond):undefined).orderBy(desc(assets.id)),db.select().from(departments),db.select().from(assetCategories),req.query.templateId?db.select().from(reportTemplates).where(eq(reportTemplates.id,Number(req.query.templateId))).limit(1):Promise.resolve([] as any[])]);
    const dmap=new Map(deptRows.map((d:any)=>[Number(d.id),d.name])); const cmap=new Map(catRows.map((c:any)=>[Number(c.id),c.name]));
    const statusMap:any={in_use:"Đang sử dụng",available:"Sẵn sàng cấp phát",pending_allocation:"Sẵn sàng cấp phát",pending_return:"Chờ thu hồi",repair:"Đang sửa chữa",damaged:"Hư hỏng - chờ thanh lý",retired:"Đã thanh lý"};
    const rows=assetRows.map((a:any)=>[a.assetCode,a.name,cmap.get(Number(a.categoryId))||"",dmap.get(Number(a.departmentId))||"",a.userText||"",a.serialNumber||"",statusMap[a.status]||a.status,a.note||""]);
    const byDept=new Map<string,any[]>(); for(const r of assetRows){const k=dmap.get(Number(r.departmentId))||"Chưa phân phòng ban";if(!byDept.has(k))byDept.set(k,[]);byDept.get(k)!.push(r);}
    const deptSummary:any[][]=[["Phòng ban","Tổng tài sản","Đang sử dụng","Sẵn sàng","Đang sửa chữa","Hư hỏng - chờ thanh lý","Đã thanh lý"]]; for(const [name,list] of byDept.entries()){deptSummary.push([name,list.length,list.filter((a:any)=>a.status==="in_use").length,list.filter((a:any)=>a.status==="available").length,list.filter((a:any)=>a.status==="repair").length,list.filter((a:any)=>a.status==="damaged").length,list.filter((a:any)=>a.status==="retired").length]);}
    const repairRows=assetRows.filter((a:any)=>["repair","damaged"].includes(a.status)).map((a:any)=>[a.assetCode,a.name,dmap.get(Number(a.departmentId))||"Chưa phân phòng ban",a.userText||"",statusMap[a.status]||a.status,a.serialNumber||"",a.note||""]);
    const esc=(v:any)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const sheet=(name:string,headers:any[],data:any[])=>`<Worksheet ss:Name="${esc(name)}"><Table><Row>${headers.map(h=>`<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join("")}</Row>${data.map(row=>`<Row>${row.map((v:any)=>`<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`).join("")}</Row>`).join("")}</Table></Worksheet>`;
    const type=String(req.query.type||"all");
    const title=String(req.query.title||"BÁO CÁO THIẾT BỊ, TÀI SẢN"); const reportDept=String(req.query.reportDepartment||""); const reportLocation=String(req.query.reportLocation||"");
    const totalSheet=sheet("Tong tai san",["Mã tài sản","Tên tài sản","Loại tài sản","Phòng ban","Người sử dụng","Serial Number","Trạng thái","Ghi chú"],rows);
    const deptSheet=sheet("Theo phong ban",deptSummary[0],deptSummary.slice(1));
    const repairSheet=sheet("Hu hong sua chua",["Mã tài sản","Tên tài sản","Phòng ban","Người sử dụng","Trạng thái","Serial Number","Ghi chú"],repairRows);
    const selected=type==="tong-tai-san"?totalSheet:type==="theo-phong-ban"?deptSheet:type==="hu-hong-sua-chua"?repairSheet:totalSheet+deptSheet+repairSheet;
    const metaSheet=sheet("Thong tin",["Tiêu đề","Phòng ban","Vị trí","Biểu mẫu"],[[title,reportDept,reportLocation,templateRows[0]?.fileName||"Không chọn"]]);
    const xml=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${metaSheet}${selected}</Workbook>`;
    res.setHeader("Content-Type","application/vnd.ms-excel; charset=utf-8");res.setHeader("Content-Disposition",`attachment; filename="IT-quanlytaisan-${type}.xls"`);return res.send(xml);
  });


}
