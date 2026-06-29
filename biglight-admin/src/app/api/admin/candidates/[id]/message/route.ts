import { NextResponse } from "next/server";
import type { MessageSender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { isAllowedAdminEmail } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/messageServer";
import { translate, detectLang } from "@/lib/translate";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// POST { text } — Staff/Admin chủ động nhắn tin cho 1 ứng viên (từ 応募者管理), tạo hội thoại nếu chưa có.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  if (!isAllowedAdminEmail(g.user.email)) return NextResponse.json({ error: "社内アカウント（@biglight.jp）のみ送信できます。" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (!text) return NextResponse.json({ error: "メッセージを入力してください。" }, { status: 400 });

  const cand = await prisma.candidate.findUnique({ where: { id: params.id }, select: { id: true, userId: true } });
  if (!cand) return NextResponse.json({ error: "応募者が見つかりません。" }, { status: 404 });

  const conv = await getOrCreateConversation(cand.id);
  const srcLang = detectLang(text);
  const jaText = srcLang === "ja" ? text : await translate(text, "ja", srcLang);
  const translated = await translate(jaText, "vi", "ja"); // ứng viên xem tiếng Việt
  const role: MessageSender = g.level === "ADMIN" ? "ADMIN" : "STAFF";

  await prisma.message.create({
    data: { conversationId: conv.id, senderId: g.user.id, senderRole: role, originalLanguage: "ja", originalText: jaText, translatedText: translated, translatedLanguage: "vi", isRead: false },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessage: jaText, lastMessageAt: new Date(), unreadByCandidate: true, status: "IN_PROGRESS", aiPausedUntil: new Date(Date.now() + 24 * 3600 * 1000) },
  });
  await notify(cand.userId, { type: "message", title: "新しいメッセージが届きました", body: jaText.slice(0, 80), link: "/mypage?sec=messages" });

  return NextResponse.json({ ok: true });
}
