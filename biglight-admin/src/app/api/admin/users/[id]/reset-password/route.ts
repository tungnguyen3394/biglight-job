import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/users/[id]/reset-password — đặt lại mật khẩu tạm. Chỉ ADMIN.
// Lưu ý: đăng nhập admin hiện dùng Google. Mật khẩu tạm chỉ dùng nếu bật login mật khẩu.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard("users.reset");
  if (!g.ok) return g.res;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sinh mật khẩu tạm 12 ký tự, dễ copy.
  const temp = randomBytes(9).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 12) || "Biglight2026";
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await hashPassword(temp) } });
  await logAudit({ actorId: g.user.id, actorName: g.user.name, action: "user.resetpw", targetType: "user", targetId: target.id, targetName: target.name });

  return NextResponse.json({ ok: true, tempPassword: temp });
}
