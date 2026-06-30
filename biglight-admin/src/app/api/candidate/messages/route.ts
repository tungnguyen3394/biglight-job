import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateConversation, shapeMessage } from "@/lib/messageServer";
import { translate, detectLang } from "@/lib/translate";
import { aiKeyConfigured, getAiConfig, aiReply, type ChatTurn } from "@/lib/ai";

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

  // ===== AI tự trả lời (nếu: có key + AI bật toàn cục + hội thoại bật AI + không bị tạm dừng) =====
  let aiMessage: ReturnType<typeof shapeMessage> | null = null;
  const fresh = await prisma.conversation.findUnique({ where: { id: conv.id }, select: { aiEnabled: true, aiPausedUntil: true } });
  const paused = fresh?.aiPausedUntil ? fresh.aiPausedUntil.getTime() > Date.now() : false;
  if (aiKeyConfigured() && fresh?.aiEnabled && !paused) {
    const cfg = await getAiConfig();
    if (cfg.enabled) {
      // LẤY 30 TIN MỚI NHẤT (desc) rồi đảo lại đúng thứ tự thời gian — KHÔNG lấy 30 tin cũ nhất,
      // nếu không khi hội thoại dài AI sẽ không thấy câu trả lời mới và hỏi lại câu cũ.
      const histDesc = await prisma.message.findMany({ where: { conversationId: conv.id, recalledAt: null, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 30, select: { senderRole: true, originalText: true } });
      const turns: ChatTurn[] = histDesc.reverse().map((h) => ({ role: h.senderRole === "CANDIDATE" ? "user" : "assistant", content: h.originalText }));
      const ai = await aiReply(turns, cfg.instructions, cfg.model);
      if (ai && ai.text) {
        const aiJa = src === "ja" ? ai.text : await translate(ai.text, "ja", src);
        const m = await prisma.message.create({ data: { conversationId: conv.id, senderId: null, senderRole: "AI", originalLanguage: src, originalText: ai.text, translatedText: aiJa, translatedLanguage: "ja", isRead: false } });
        aiMessage = shapeMessage(m);
        await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: ai.text, lastMessageAt: new Date(), ...(ai.handoff ? { aiEnabled: false } : {}) } });
      }
    }
  }

  return NextResponse.json({ message: shapeMessage(msg), aiMessage });
}

// PATCH { id, action: "recall" } — ứng viên thu hồi tin của chính mình.
export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const candidate = await prisma.candidate.findUnique({ where: { userId: session.id }, select: { id: true } });
  if (!candidate) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  if (b.action !== "recall" || typeof b.id !== "string") return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const msg = await prisma.message.findUnique({ where: { id: b.id }, include: { conversation: { select: { candidateId: true } } } });
  if (!msg || msg.conversation.candidateId !== candidate.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.senderRole !== "CANDIDATE" || msg.senderId !== session.id) return NextResponse.json({ error: "自分のメッセージのみ取り消せます。" }, { status: 403 });
  if (msg.recalledAt) return NextResponse.json({ ok: true });

  await prisma.message.update({ where: { id: msg.id }, data: { recalledAt: new Date(), recalledById: session.id } });
  const last = await prisma.message.findFirst({ where: { conversationId: msg.conversationId, deletedAt: null, recalledAt: null }, orderBy: { createdAt: "desc" } });
  await prisma.conversation.update({ where: { id: msg.conversationId }, data: { lastMessage: last?.originalText ?? null, lastMessageAt: last?.createdAt ?? null } });
  return NextResponse.json({ ok: true });
}
