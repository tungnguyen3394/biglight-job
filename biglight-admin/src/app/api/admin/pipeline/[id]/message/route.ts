import { NextResponse } from "next/server";
import type { MessageSender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { isAllowedAdminEmail } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/messageServer";
import { translate, detectLang } from "@/lib/translate";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// POST { text } — gửi tin nhắn cho ứng viên của đơn này (quick action trong panel).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  if (!isAllowedAdminEmail(g.user.email)) return NextResponse.json({ error: "社内アカウント（@biglight.jp）のみ送信できます。" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (!text) return NextResponse.json({ error: "メッセージを入力してください。" }, { status: 400 });

  const app = await prisma.application.findUnique({ where: { id: params.id }, select: { candidateId: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conv = await getOrCreateConversation(app.candidateId);
  const src = detectLang(text);
  const jaText = src === "ja" ? text : await translate(text, "ja", src);
  const translated = await translate(jaText, "vi", "ja");
  const role: MessageSender = g.level === "ADMIN" ? "ADMIN" : "STAFF";

  await prisma.message.create({
    data: { conversationId: conv.id, senderId: g.user.id, senderRole: role, originalLanguage: "ja", originalText: jaText, translatedText: translated, translatedLanguage: "vi", isRead: false },
  });
  await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: jaText, lastMessageAt: new Date(), unreadByCandidate: true, status: "IN_PROGRESS" } });

  const cand = await prisma.candidate.findUnique({ where: { id: app.candidateId }, select: { userId: true } });
  await notify(cand?.userId, { type: "message", title: "新しいメッセージが届きました", body: jaText.slice(0, 80), link: "/mypage?sec=messages" });

  return NextResponse.json({ ok: true });
}
