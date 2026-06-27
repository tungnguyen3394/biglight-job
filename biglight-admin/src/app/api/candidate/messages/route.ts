import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateConversation, shapeMessage } from "@/lib/messageServer";
import { translate, detectLang } from "@/lib/translate";

export const dynamic = "force-dynamic";

// GET /api/candidate/messages — hội thoại của ứng viên (tạo + tin chào nếu lần đầu).
export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const candidate = await prisma.candidate.findUnique({ where: { userId: session.id } });
  if (!candidate) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const conv = await getOrCreateConversation(candidate.id);
  // Ứng viên đang đọc → đánh dấu tin của admin/system là đã đọc.
  await prisma.message.updateMany({
    where: { conversationId: conv.id, senderRole: { in: ["ADMIN", "STAFF", "SYSTEM"] }, isRead: false },
    data: { isRead: true },
  });
  if (conv.unreadByCandidate) await prisma.conversation.update({ where: { id: conv.id }, data: { unreadByCandidate: false } });

  const messages = await prisma.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ status: conv.status, messages: messages.map(shapeMessage) });
}

// POST /api/candidate/messages { text } — ứng viên gửi tin.
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const candidate = await prisma.candidate.findUnique({ where: { userId: session.id } });
  if (!candidate) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (!text) return NextResponse.json({ error: "メッセージを入力してください。" }, { status: 400 });

  const conv = await getOrCreateConversation(candidate.id);
  const src = detectLang(text);
  const translated = await translate(text, "ja", src); // admin xem tiếng Nhật

  const msg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: session.id,
      senderRole: "CANDIDATE",
      originalLanguage: src,
      originalText: text,
      translatedText: translated,
      translatedLanguage: "ja",
      isRead: false,
    },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessage: text, lastMessageAt: new Date(), unreadByAdmin: true, status: "WAITING" },
  });

  return NextResponse.json({ message: shapeMessage(msg) });
}
