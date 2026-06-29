// Lightweight, transparent auth: bcrypt password hashing + signed JWT session
// stored in an httpOnly cookie. Easy to read, easy to hand over, no heavy lib.

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role, AdminRole } from "@prisma/client";
import type { SessionUser } from "./permissions";

export const SESSION_COOKIE = "bl_session";

// Chỉ cho phép nhân viên BIGLIGHT (email tên miền @biglight.jp) đăng nhập khu quản trị.
// Có thể đổi/ mở rộng nhiều tên miền qua biến môi trường ALLOWED_EMAIL_DOMAINS (ngăn cách bởi dấu phẩy).
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || "biglight.jp")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-insecure-secret-change-me"
);
const SESSION_HOURS = Number(process.env.SESSION_HOURS || "12");

export interface SessionPayload extends SessionUser {
  [key: string]: unknown;
}

// ---- password ----
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---- jwt ----
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    adminRole: user.adminRole ?? null,
    companyId: user.companyId,
    ctvId: user.ctvId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.sub),
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: payload.role as Role,
      adminRole: (payload.adminRole as AdminRole) ?? null,
      companyId: (payload.companyId as string) ?? null,
      ctvId: (payload.ctvId as string) ?? null,
    };
  } catch {
    return null;
  }
}

// ---- session helpers (server components / route handlers) ----
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  };
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  cookies().set(SESSION_COOKIE, token, cookieOptions());
}

// Gắn cookie phiên TRỰC TIẾP vào một NextResponse (vd redirect trong OAuth callback).
// Cần thiết vì cookies().set() KHÔNG chắc chắn đính vào NextResponse.redirect() tự tạo
// → nếu thiếu, phiên đăng nhập mới (mobile chưa có cookie) sẽ không được lưu.
export async function attachSessionCookie(res: NextResponse, user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  res.cookies.set(SESSION_COOKIE, token, cookieOptions());
}

export function clearSessionCookie(): void {
  // Ghi đè cookie rỗng + Max-Age 0 với CÙNG options (path/secure/sameSite) để xoá chắc chắn,
  // kể cả trên HTTPS nơi cookies().delete() đôi khi không khớp thuộc tính → phiên còn sót.
  cookies().set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  cookies().delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Trang public: CHỈ phiên ứng viên (role CANDIDATE) mới coi là "đã đăng nhập".
// Admin/staff/khách → null → hiện 30秒で無料登録 thay vì マイページ.
export async function isCandidateLoggedIn(): Promise<boolean> {
  const u = await getSessionUser();
  return u?.role === "CANDIDATE";
}
