import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-insecure-secret-change-me"
);
const SESSION_COOKIE = "bl_session";

// Vai trò được phép vào khu quản trị (/admin). Ứng viên (CANDIDATE) KHÔNG được vào.
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "MANAGER", "BIGLIGHT_STAFF", "CTV", "COMPANY"]);

// Khu vực chỉ dành cho cấp ADMIN nội bộ (Staff/View bị chặn ngay ở middleware).
const ADMIN_ONLY_PREFIXES = ["/admin/users", "/admin/settings"];

// Suy ra cấp nội bộ từ JWT (adminRole ưu tiên; fallback theo role gốc).
function levelOf(role: string | null, adminRole: string | null): "ADMIN" | "STAFF" | "VIEW" | null {
  if (adminRole === "ADMIN" || adminRole === "STAFF" || adminRole === "VIEW") return adminRole;
  if (role === "SUPER_ADMIN" || role === "MANAGER") return "ADMIN";
  if (role === "BIGLIGHT_STAFF") return "STAFF";
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let valid = false;
  let role: string | null = null;
  let adminRole: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      role = (payload.role as string) ?? null;
      adminRole = (payload.adminRole as string) ?? null;
      valid = true;
    } catch {
      valid = false;
    }
  }

  // Bảo vệ giao diện admin
  if (pathname.startsWith("/admin")) {
    // Chưa đăng nhập → về /login
    if (!valid) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    // Đã đăng nhập nhưng KHÔNG phải role admin (vd: ứng viên Google/Facebook) → đẩy về trang ứng viên.
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL("/mypage", req.url));
    }
    // Khu ADMIN-only (User Management / Settings): chỉ cấp ADMIN. Staff/View → về Dashboard.
    if (ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && levelOf(role, adminRole) !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // API công khai cho user site (không cần đăng nhập)
  const isPublicApi = pathname.startsWith("/api/jobs/public") || pathname.startsWith("/api/jobs/featured") || pathname.startsWith("/api/uploads") || pathname.startsWith("/api/og");

  // Bảo vệ API (trừ auth + public): 401 JSON
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !isPublicApi && !valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
