import { NextResponse } from "next/server";
import type { ConversationStatus, MessageSender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { isAllowedAdminEmail } from "@/lib/auth";
import { shapeMessage } from "@/lib/messageServer";
import { translate, detectLang } from "@/lib/translate";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// GET — 1 hội thoại: thông tin ứng viên + tin nhắn (đánh dấu đã đọc cho admin).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard("messages.read");
  if (!g.ok) return g.res;

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      candidate: {
        include: {
          user: { select: { email: true, image: true } },
          applications: { include: { job: { select: { title: true } } }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.message.updateMany({ where: { conversationId: conv.id, senderRole: "CANDIDATE", isRead: false }, data: { isRead: true } });
  if (conv.unreadByAdmin) await prisma.conversation.update({ where: { id: conv.id }, data: { unreadByAdmin: false } });

  const messages = await prisma.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "asc" } });
  // tên người gửi (Staff/Admin) để biết ai đang phụ trách
  const ids = [...new Set(messages.map((m) => m.senderId).filter((x): x is string => !!x))];
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const c = conv.candidate;
  return NextResponse.json({
    status: conv.status,
    candidate: {
      id: c.id,
      name: c.name,
      email: c.email ?? c.user?.email ?? null,
      phone: c.phone,
      nationality: c.nationality,
      japaneseLevel: c.japaneseLevel,
      image: c.user?.image ?? null,
      jobs: c.applications.map((a) => a.job.title),
    },
    messages: messages.map((m) => ({ ...shapeMessage(m), senderName: m.senderId ? nameById.get(m.senderId) ?? null : null })),
  });
}

// POST { text } — Admin/Staff trả lời (chỉ @biglight.jp).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  if (!isAllowedAdminEmail(g.user.email)) {
    return NextResponse.json({ error: "社内アカウント（@biglight.jp）のみ返信できます。" }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (!text) return NextResponse.json({ error: "メッセージを入力してください。" }, { status: 400 });

  const conv = await prisma.conversation.findUnique({ where: { id: params.id }, include: { candidate: { select: { userId: true } } } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Nếu admin gõ ngôn ngữ khác tiếng Nhật → tự động dịch sang tiếng Nhật để lưu chuẩn.
  const src = detectLang(text);
  const jaText = src === "ja" ? text : await translate(text, "ja", src);
  const translated = await translate(jaText, "vi", "ja"); // ứng viên xem tiếng Việt
  const role: MessageSender = g.level === "ADMIN" ? "ADMIN" : "STAFF";

  const msg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: g.user.id,
      senderRole: role,
      originalLanguage: "ja",
      originalText: jaText,
      translatedText: translated,
      translatedLanguage: "vi",
      isRead: false,
    },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessage: jaText, lastMessageAt: new Date(), unreadByCandidate: true, status: "IN_PROGRESS" },
  });
  await notify(conv.candidate.userId, { type: "message", title: "新しいメッセージが届きました", body: jaText.slice(0, 80), link: "/mypage?sec=messages" });

  return NextResponse.json({ message: { ...shapeMessage(msg), senderName: g.user.name } });
}

// DELETE — xoá toàn bộ hội thoại (kèm tin nhắn). Admin/Staff được xóa, View không.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  await prisma.conversation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// PATCH { status } — đổi trạng thái hội thoại.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;

  const b = await req.json().catch(() => ({}));
  const valid: ConversationStatus[] = ["WAITING", "IN_PROGRESS", "DONE"];
  if (!valid.includes(b.status)) return NextResponse.json({ error: "無効な状態です。" }, { status: 422 });

  const conv = await prisma.conversation.update({ where: { id: params.id }, data: { status: b.status as ConversationStatus } });
  return NextResponse.json({ ok: true, status: conv.status });
}
