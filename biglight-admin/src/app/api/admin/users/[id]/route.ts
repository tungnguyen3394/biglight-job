import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import type { AdminRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const LEVELS: AdminRole[] = ["ADMIN", "STAFF", "VIEW"];

// Đếm số tài khoản cấp ADMIN đang ACTIVE (để không bao giờ xoá hết Admin cuối cùng).
async function countActiveAdmins(excludeId?: string): Promise<number> {
  const internal = await prisma.user.findMany({
    where: { status: "ACTIVE", role: { in: ["SUPER_ADMIN", "MANAGER", "BIGLIGHT_STAFF"] } },
    select: { id: true, role: true, adminRole: true },
  });
  return internal.filter((u) => {
    if (u.id === excludeId) return false;
    const lvl = u.adminRole ?? (u.role === "SUPER_ADMIN" || u.role === "MANAGER" ? "ADMIN" : u.role === "BIGLIGHT_STAFF" ? "STAFF" : null);
    return lvl === "ADMIN";
  }).length;
}

function levelOf(u: { role: string; adminRole: AdminRole | null }): AdminRole | null {
  if (u.adminRole) return u.adminRole;
  if (u.role === "SUPER_ADMIN" || u.role === "MANAGER") return "ADMIN";
  if (u.role === "BIGLIGHT_STAFF") return "STAFF";
  return null;
}

// PATCH /api/admin/users/[id] — đổi tên / đổi cấp (role) / khoá-mở (status). Chỉ ADMIN.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("users.update");
  if (!g.ok) return g.res;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const data: { name?: string; adminRole?: AdminRole; status?: "ACTIVE" | "SUSPENDED" } = {};
  const isSelf = g.user.id === target.id;
  const curLevel = levelOf(target);

  // Đổi tên
  if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim();

  // Đổi cấp (role)
  if (b.adminRole !== undefined) {
    if (!LEVELS.includes(b.adminRole)) return NextResponse.json({ error: "無効なロールです。" }, { status: 422 });
    // Không cho tự đổi cấp của chính mình (tránh tự nâng/hạ quyền).
    if (isSelf) return NextResponse.json({ error: "自分のロールは変更できません。" }, { status: 403 });
    // Không hạ cấp Admin cuối cùng.
    if (curLevel === "ADMIN" && b.adminRole !== "ADMIN" && (await countActiveAdmins(target.id)) === 0) {
      return NextResponse.json({ error: "最後のAdminのロールは変更できません。" }, { status: 409 });
    }
    data.adminRole = b.adminRole;
  }

  // Khoá / mở khoá
  if (b.status !== undefined) {
    if (b.status !== "ACTIVE" && b.status !== "SUSPENDED") return NextResponse.json({ error: "無効な状態です。" }, { status: 422 });
    if (isSelf && b.status === "SUSPENDED") return NextResponse.json({ error: "自分自身をロックできません。" }, { status: 403 });
    if (b.status === "SUSPENDED" && curLevel === "ADMIN" && (await countActiveAdmins(target.id)) === 0) {
      return NextResponse.json({ error: "最後のAdminはロックできません。" }, { status: 409 });
    }
    data.status = b.status;
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data,
    select: { id: true, name: true, email: true, role: true, adminRole: true, status: true, lastLoginAt: true, image: true },
  });
  const actor = { actorId: g.user.id, actorName: g.user.name, targetType: "user", targetId: target.id, targetName: user.name };
  if (data.name) await logAudit({ ...actor, action: "user.rename", detail: `${target.name} → ${data.name}` });
  if (data.adminRole) await logAudit({ ...actor, action: "user.role", detail: `→ ${data.adminRole}` });
  if (data.status) await logAudit({ ...actor, action: data.status === "SUSPENDED" ? "user.lock" : "user.unlock" });
  return NextResponse.json({ user });
}

// DELETE /api/admin/users/[id] — xoá tài khoản nội bộ. Chỉ ADMIN.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard("users.delete");
  if (!g.ok) return g.res;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (g.user.id === target.id) return NextResponse.json({ error: "自分自身は削除できません。" }, { status: 403 });
  if (levelOf(target) === "ADMIN" && (await countActiveAdmins(target.id)) === 0) {
    return NextResponse.json({ error: "最後のAdminは削除できません。" }, { status: 409 });
  }

  // Không xoá tài khoản gắn với hồ sơ ứng viên/công ty (an toàn dữ liệu).
  if (target.role === "CANDIDATE" || target.role === "COMPANY" || target.role === "CTV") {
    return NextResponse.json({ error: "この種類のアカウントはここから削除できません。" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: target.id } });
  await logAudit({ actorId: g.user.id, actorName: g.user.name, action: "user.delete", targetType: "user", targetId: target.id, targetName: target.name, detail: target.email });
  return NextResponse.json({ ok: true });
}
