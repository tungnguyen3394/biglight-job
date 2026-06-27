import { prisma } from "./prisma";

// Tạo 1 thông báo cho 1 tài khoản (userId). Bỏ qua nếu không có userId.
export async function notify(
  userId: string | null | undefined,
  data: { type: "message" | "application" | "status"; title: string; body?: string; link?: string }
): Promise<void> {
  if (!userId) return;
  try {
    await prisma.notification.create({ data: { userId, ...data } });
  } catch {
    /* thông báo không bắt buộc — lỗi không chặn luồng chính */
  }
}
