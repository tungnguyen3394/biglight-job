import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Cập nhật lastMessage của hội thoại = tin gần nhất còn hiển thị (bỏ qua đã xóa/thu hồi).
async function refreshLast(conversationId: string) {
  const last = await prisma.message.findFirst({
    where: { conversationId, deletedAt: null, recalledAt: null },
    orderBy: { createdAt: "desc" },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: last?.originalText ?? null, lastMessageAt: last?.createdAt ?? null },
  });
}

// DELETE — 削除 (kiểm duyệt). Admin/Staff xóa mọi tin, View không. Soft-delete (giữ lịch sử).
export async function DELETE(_req: Request, { params }: { params: { id: string; msgId: string } }) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;

  const msg = await prisma.message.findUnique({ where: { id: params.msgId } });
  if (!msg || msg.conversationId !== params.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.deletedAt) return NextResponse.json({ ok: true });

  await prisma.message.update({ where: { id: params.msgId }, data: { deletedAt: new Date(), deletedById: g.user.id } });
  await refreshLast(params.id);
  return NextResponse.json({ ok: true });
}

// PATCH { action: "recall" } — 送信取消 / 取り消し. Người gửi thu hồi tin của mình; Admin thu hồi mọi tin.
export async function PATCH(req: Request, { params }: { params: { id: string; msgId: string } }) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  const b = await req.json().catch(() => ({}));
  if (b.action !== "recall") return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const msg = await prisma.message.findUnique({ where: { id: params.msgId } });
  if (!msg || msg.conversationId !== params.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.recalledAt) return NextResponse.json({ ok: true });

  const isOwn = !!msg.senderId && msg.senderId === g.user.id;
  if (g.level !== "ADMIN" && !isOwn) {
    return NextResponse.json({ error: "自分が送信したメッセージのみ取り消せます。" }, { status: 403 });
  }

  await prisma.message.update({ where: { id: params.msgId }, data: { recalledAt: new Date(), recalledById: g.user.id } });
  await refreshLast(params.id);
  return NextResponse.json({ ok: true });
}
