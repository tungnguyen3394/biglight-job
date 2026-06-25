// Lightweight, transparent auth: bcrypt password hashing + signed JWT session
// stored in an httpOnly cookie. Easy to read, easy to hand over, no heavy lib.

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
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
      companyId: (payload.companyId as string) ?? null,
      ctvId: (payload.ctvId as string) ?? null,
    };
  } catch {
    return null;
  }
}

// ---- session helpers (server components / route handlers) ----
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
