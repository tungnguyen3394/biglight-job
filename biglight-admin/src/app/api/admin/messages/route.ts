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

  const conversations = convs.map((c) => ({
    id: c.id,
    candidateId: c.candidateId,
    name: c.candidate.name,
    image: c.candidate.user?.image ?? null,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
    unread: c.unreadByAdmin,
    status: c.status,
  }));
  return NextResponse.json({ conversations });
}
