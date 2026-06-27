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

// ADMIN = full_access (luôn true). STAFF/VIEW tra theo tập quyền ở trên.
export function adminCan(level: AdminLevel | null | undefined, perm: Permission): boolean {
  if (level === "ADMIN") return true;
  if (level === "STAFF") return STAFF_SET.has(perm);
  if (level === "VIEW") return VIEW_SET.has(perm);
  return false;
}

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
