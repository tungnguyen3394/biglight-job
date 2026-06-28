import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

// GET — nhật ký thao tác gần đây (100 mục). Chỉ Admin (audit.read).
export async function GET() {
  const g = await guard("audit.read");
  if (!g.ok) return g.res;
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ logs: logs.map((l) => ({ id: l.id, actorName: l.actorName, action: l.action, targetName: l.targetName, detail: l.detail, createdAt: l.createdAt.toISOString() })) });
}
