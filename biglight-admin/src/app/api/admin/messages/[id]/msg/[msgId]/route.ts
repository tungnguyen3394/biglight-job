import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

// DELETE — xoá 1 tin nhắn. Chỉ cấp có quyền messages.delete (Admin).
export async function DELETE(_req: Request, { params }: { params: { id: string; msgId: string } }) {
  const g = await guard("messages.delete");
  if (!g.ok) return g.res;

  const msg = await prisma.message.findUnique({ where: { id: params.msgId } });
  if (!msg || msg.conversationId !== params.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.message.delete({ where: { id: params.msgId } });

  // Cập nhật lại tin cuối của hội thoại.
  const last = await prisma.message.findFirst({ where: { conversationId: params.id }, orderBy: { createdAt: "desc" } });
  await prisma.conversation.update({
    where: { id: params.id },
    data: { lastMessage: last?.originalText ?? null, lastMessageAt: last?.createdAt ?? null },
  });

  return NextResponse.json({ ok: true });
}
