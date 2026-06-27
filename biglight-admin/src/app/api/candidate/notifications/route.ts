import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET — thông báo gần đây + số chưa đọc (chuông poll ~30s).
export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") return NextResponse.json({ notifications: [], unread: 0 });

  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.count({ where: { userId: session.id, isRead: false } }),
  ]);
  return NextResponse.json({
    unread,
    notifications: rows.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, isRead: n.isRead, createdAt: n.createdAt.toISOString() })),
  });
}

// POST — đánh dấu đã đọc (tất cả, hoặc 1 id).
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (typeof b.id === "string") {
    await prisma.notification.updateMany({ where: { id: b.id, userId: session.id }, data: { isRead: true } });
  } else {
    await prisma.notification.updateMany({ where: { userId: session.id, isRead: false }, data: { isRead: true } });
  }
  return NextResponse.json({ ok: true });
}
