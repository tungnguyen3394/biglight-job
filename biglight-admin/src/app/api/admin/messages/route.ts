import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

// GET /api/admin/messages — danh sách hội thoại (Admin/Staff/View đều xem được).
export async function GET() {
  const g = await guard("messages.read");
  if (!g.ok) return g.res;

  const convs = await prisma.conversation.findMany({
    orderBy: [{ lastMessageAt: "desc" }],
    include: { candidate: { include: { user: { select: { image: true } } } } },
  });

  // 担当者 = nhân viên Admin/Staff trả lời gần nhất trong mỗi hội thoại.
  const staffMsgs = await prisma.message.findMany({
    where: { senderRole: { in: ["ADMIN", "STAFF"] }, senderId: { not: null }, recalledAt: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    distinct: ["conversationId"],
    select: { conversationId: true, senderId: true },
  });
  const staffIds = [...new Set(staffMsgs.map((m) => m.senderId!).filter(Boolean))];
  const users = staffIds.length ? await prisma.user.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } }) : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  const staffByConv = new Map(staffMsgs.map((m) => [m.conversationId, m.senderId ? nameById.get(m.senderId) ?? null : null]));

  const conversations = convs.map((c) => ({
    id: c.id,
    candidateId: c.candidateId,
    name: c.candidate.name,
    image: c.candidate.user?.image ?? null,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
    unread: c.unreadByAdmin,
    status: c.status,
    staffName: staffByConv.get(c.id) ?? null,
  }));
  return NextResponse.json({ conversations });
}
