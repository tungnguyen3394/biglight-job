import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { isAllowedAdminEmail } from "@/lib/auth";
import type { AdminRole } from "@prisma/client";

export const dynamic = "force-dynamic";

// Các role được coi là "tài khoản nội bộ" (hiện trong User Management).
const INTERNAL_ROLES = ["SUPER_ADMIN", "MANAGER", "BIGLIGHT_STAFF"] as const;
const LEVELS: AdminRole[] = ["ADMIN", "STAFF", "VIEW"];

// GET /api/admin/users — danh sách tài khoản nội bộ (chỉ ADMIN).
export async function GET() {
  const g = await guard("users.read");
  if (!g.ok) return g.res;

  const users = await prisma.user.findMany({
    where: { role: { in: INTERNAL_ROLES as unknown as ("SUPER_ADMIN" | "MANAGER" | "BIGLIGHT_STAFF")[] } },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, adminRole: true, status: true, lastLoginAt: true, image: true },
  });
  return NextResponse.json({ users });
}

// POST /api/admin/users — tạo tài khoản nội bộ mới (chỉ ADMIN).
export async function POST(req: Request) {
  const g = await guard("users.create");
  if (!g.ok) return g.res;

  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  const email = String(b.email ?? "").trim().toLowerCase();
  const level = (LEVELS.includes(b.adminRole) ? b.adminRole : "VIEW") as AdminRole;

  if (!name) return NextResponse.json({ error: "氏名を入力してください。" }, { status: 422 });
  if (!email) return NextResponse.json({ error: "メールアドレスを入力してください。" }, { status: 422 });
  // Tài khoản nội bộ phải là email công ty (@biglight.jp) — đăng nhập bằng Google.
  if (!isAllowedAdminEmail(email)) {
    return NextResponse.json({ error: "社内メール（@biglight.jp）のみ登録できます。" }, { status: 422 });
  }
  const dup = await prisma.user.findUnique({ where: { email } });
  if (dup) return NextResponse.json({ error: "このメールアドレスは既に登録されています。" }, { status: 409 });

  const user = await prisma.user.create({
    data: { name, email, role: "BIGLIGHT_STAFF", adminRole: level, status: "ACTIVE" },
    select: { id: true, name: true, email: true, role: true, adminRole: true, status: true, lastLoginAt: true, image: true },
  });
  await logAudit({ actorId: g.user.id, actorName: g.user.name, action: "user.create", targetType: "user", targetId: user.id, targetName: user.name, detail: `${user.email}（${level}）` });
  return NextResponse.json({ user });
}
