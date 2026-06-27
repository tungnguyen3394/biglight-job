import { prisma } from "./prisma";
import { WELCOME_JA, WELCOME_VI } from "./messageConstants";

// Lấy conversation của ứng viên; nếu chưa có thì tạo + tin chào (system) 1 lần.
export async function getOrCreateConversation(candidateId: string) {
  const existing = await prisma.conversation.findUnique({ where: { candidateId } });
  if (existing) return existing;
  return prisma.conversation.create({
    data: {
      candidateId,
      status: "WAITING",
      welcomedAt: new Date(),
      lastMessage: WELCOME_JA,
      lastMessageAt: new Date(),
      messages: {
        create: {
          senderRole: "SYSTEM",
          originalLanguage: "ja",
          originalText: WELCOME_JA,
          translatedText: WELCOME_VI,
          translatedLanguage: "vi",
          isRead: true,
        },
      },
    },
  });
}

// Định dạng message trả về client (nguyên bản + bản dịch; client tự chọn hiển thị).
export function shapeMessage(m: {
  id: string;
  senderRole: string;
  senderId: string | null;
  originalLanguage: string;
  originalText: string;
  translatedText: string | null;
  translatedLanguage: string | null;
  createdAt: Date;
}) {
  return {
    id: m.id,
    senderRole: m.senderRole,
    senderId: m.senderId,
    originalLanguage: m.originalLanguage,
    originalText: m.originalText,
    translatedText: m.translatedText,
    translatedLanguage: m.translatedLanguage,
    createdAt: m.createdAt.toISOString(),
  };
}
