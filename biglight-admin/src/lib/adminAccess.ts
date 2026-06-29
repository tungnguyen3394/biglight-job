// ----------------------------------------------------------------------------
// RBAC NỘI BỘ — 3 cấp Admin / Staff / View.
// Đây là NGUỒN SỰ THẬT DUY NHẤT cho "ai được làm gì" trong khu quản trị.
// Backend (API route / server action) BẮT BUỘC gọi guard ở đây, không chỉ ẩn UI.
//
// Mô hình: tài khoản nội bộ dùng cột User.adminRole (ADMIN/STAFF/VIEW). Với tài
// khoản cũ chưa set adminRole, ta suy ra cấp từ Role gốc (an toàn, không phá login).
// ----------------------------------------------------------------------------

import type { AdminRole, Role } from "@prisma/client";
import { can, type Action, type Resource } from "./permissions";

export type AdminLevel = AdminRole; // "ADMIN" | "STAFF" | "VIEW"

// Mọi quyền (capability) trong hệ thống. Đặt tên theo "tài_nguyên.hành_động".
export type Permission =
  | "dashboard.view"
  | "jobs.read" | "jobs.create" | "jobs.update" | "jobs.delete" | "jobs.publish"
  | "applicants.read" | "applicants.create" | "applicants.update" | "applicants.delete" | "applicants.status"
  | "cv.upload" | "cv.download"
  | "companies.read" | "companies.create" | "companies.update" | "companies.delete"
  | "articles.read" | "articles.create" | "articles.update" | "articles.delete" | "articles.publish"
  | "messages.read" | "messages.reply" | "messages.delete"
  | "export.read"
  | "users.read" | "users.create" | "users.update" | "users.delete" | "users.role" | "users.lock" | "users.reset"
  | "settings.view" | "settings.update"
  | "audit.read";

// Quyền của STAFF (vận hành hằng ngày): 求人 / 応募者 / 記事 + trả lời tin nhắn + export.
const STAFF_PERMS: Permission[] = [
  "dashboard.view",
  "jobs.read", "jobs.create", "jobs.update", "jobs.delete", "jobs.publish",
  "applicants.read", "applicants.create", "applicants.update", "applicants.delete", "applicants.status",
  "cv.upload", "cv.download",
  "articles.read", "articles.create", "articles.update", "articles.delete", "articles.publish",
  "messages.read", "messages.reply",
  "export.read",
];

// Quyền của VIEW (chỉ xem + tải CV + export). Không sửa/xóa/đăng/trả lời.
const VIEW_PERMS: Permission[] = [
  "dashboard.view",
  "jobs.read",
  "applicants.read",
  "companies.read",
  "articles.read",
  "messages.read",
  "cv.download",
  "export.read",
];

const STAFF_SET = new Set(STAFF_PERMS);
const VIEW_SET = new Set(VIEW_PERMS);

export const DEFAULT_PERMS: Record<"STAFF" | "VIEW", Permission[]> = { STAFF: STAFF_PERMS, VIEW: VIEW_PERMS };

// Override quyền Staff/View do Admin chỉnh (lưu DB) — nạp vào cache 1 tiến trình.
// (App chạy 1 Docker process nên cache nhất quán; rolePerms.ts nạp từ DB.)
let OVERRIDE: { STAFF?: Set<Permission>; VIEW?: Set<Permission> } = {};
export function setRolePermsCache(map: Partial<Record<"STAFF" | "VIEW", string[]>>) {
  OVERRIDE = {};
  if (Array.isArray(map.STAFF)) OVERRIDE.STAFF = new Set(map.STAFF as Permission[]);
  if (Array.isArray(map.VIEW)) OVERRIDE.VIEW = new Set(map.VIEW as Permission[]);
}

// ADMIN = full_access (luôn true). STAFF/VIEW tra theo override (nếu có) hoặc mặc định.
export function adminCan(level: AdminLevel | null | undefined, perm: Permission): boolean {
  if (level === "ADMIN") return true;
  if (level === "STAFF") return (OVERRIDE.STAFF ?? STAFF_SET).has(perm);
  if (level === "VIEW") return (OVERRIDE.VIEW ?? VIEW_SET).has(perm);
  return false;
}

// Danh sách quyền hiệu lực của 1 cấp (để truyền xuống client/Sidebar cho nhất quán).
export const ALL_PERMS: Permission[] = [
  "dashboard.view", "jobs.read", "jobs.create", "jobs.update", "jobs.delete", "jobs.publish",
  "applicants.read", "applicants.create", "applicants.update", "applicants.delete", "applicants.status",
  "cv.upload", "cv.download", "companies.read", "companies.create", "companies.update", "companies.delete",
  "articles.read", "articles.create", "articles.update", "articles.delete", "articles.publish",
  "messages.read", "messages.reply", "messages.delete", "export.read",
  "users.read", "users.create", "users.update", "users.delete", "users.role", "users.lock", "users.reset",
  "settings.view", "settings.update", "audit.read",
];
export function permsForLevel(level: AdminLevel | null | undefined): Permission[] {
  if (level === "ADMIN") return ALL_PERMS;
  if (level === "STAFF") return [...(OVERRIDE.STAFF ?? STAFF_SET)];
  if (level === "VIEW") return [...(OVERRIDE.VIEW ?? VIEW_SET)];
  return [];
}

// Catalog cho checkbox (Staff/View). KHÔNG gồm users.*/settings.* (vốn Admin-only ở middleware).
export const PERM_GROUPS: { group: string; items: { perm: Permission; label: string }[] }[] = [
  { group: "求人", items: [{ perm: "jobs.read", label: "閲覧" }, { perm: "jobs.create", label: "追加" }, { perm: "jobs.update", label: "編集" }, { perm: "jobs.delete", label: "削除" }, { perm: "jobs.publish", label: "公開" }] },
  { group: "応募者", items: [{ perm: "applicants.read", label: "閲覧" }, { perm: "applicants.create", label: "追加" }, { perm: "applicants.update", label: "編集" }, { perm: "applicants.delete", label: "削除" }, { perm: "applicants.status", label: "ステータス変更" }, { perm: "cv.download", label: "CVダウンロード" }, { perm: "cv.upload", label: "CVアップロード" }] },
  { group: "企業", items: [{ perm: "companies.read", label: "閲覧" }, { perm: "companies.create", label: "追加" }, { perm: "companies.update", label: "編集" }, { perm: "companies.delete", label: "削除" }] },
  { group: "記事", items: [{ perm: "articles.read", label: "閲覧" }, { perm: "articles.create", label: "追加" }, { perm: "articles.update", label: "編集" }, { perm: "articles.delete", label: "削除" }, { perm: "articles.publish", label: "公開" }] },
  { group: "メッセージ", items: [{ perm: "messages.read", label: "閲覧" }, { perm: "messages.reply", label: "返信" }, { perm: "messages.delete", label: "削除" }] },
  { group: "その他", items: [{ perm: "dashboard.view", label: "ダッシュボード" }, { perm: "export.read", label: "エクスポート" }, { perm: "audit.read", label: "操作ログ閲覧" }] },
];
export const EDITABLE_PERMS: Permission[] = PERM_GROUPS.flatMap((g) => g.items.map((i) => i.perm));

// Suy ra cấp nội bộ từ tài khoản. Ưu tiên cột adminRole; nếu null thì map từ Role
// gốc để tài khoản cũ vẫn chạy đúng (SUPER_ADMIN/MANAGER = ADMIN, BIGLIGHT_STAFF = STAFF).
// CTV / COMPANY / CANDIDATE KHÔNG phải nhân viên nội bộ → trả null.
export function effectiveAdminLevel(u: { role: Role; adminRole?: AdminRole | null }): AdminLevel | null {
  if (u.adminRole) return u.adminRole;
  switch (u.role) {
    case "SUPER_ADMIN":
    case "MANAGER":
      return "ADMIN";
    case "BIGLIGHT_STAFF":
      return "STAFF";
    default:
      return null; // CTV / COMPANY / CANDIDATE
  }
}

// Gate dùng cho UI (ẩn/hiện nút). Khớp HỆT logic backend denyByLevel:
// vừa thỏa role-based can() (cho CTV/COMPANY), vừa thỏa cấp nội bộ (ADMIN/STAFF/VIEW).
export function uiCan(
  u: { role: Role; adminRole?: AdminRole | null },
  action: Action,
  resource: Resource,
  perm: Permission
): boolean {
  if (!can(u.role, action, resource)) return false;
  const level = effectiveAdminLevel(u);
  if (level == null) return true; // CTV/COMPANY: do can()/scope quản
  return adminCan(level, perm);
}

// Nhãn + tông màu badge cho từng cấp (theo yêu cầu UI).
export const ADMIN_LEVEL_LABEL: Record<AdminLevel, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  VIEW: "View",
};
export const ADMIN_LEVEL_TONE: Record<AdminLevel, "red" | "green" | "blue"> = {
  ADMIN: "red",
  STAFF: "green",
  VIEW: "blue",
};
