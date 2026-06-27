import type { ConversationStatus } from "@prisma/client";

// Tin nhắn chào (system) — tạo 1 lần khi ứng viên mở メッセージ lần đầu.
export const WELCOME_JA =
  "BIGLIGHT JOBへようこそ。\nお仕事探しや応募についてご不明な点がございましたら、お気軽にこちらからメッセージをお送りください。\nBIGLIGHTスタッフが順次ご返信いたします。";

export const WELCOME_VI =
  "Chào mừng bạn đến với BIGLIGHT JOB.\nNếu bạn có thắc mắc về công việc, cách ứng tuyển, hồ sơ, visa hoặc lịch phỏng vấn, hãy nhắn tin tại đây.\nNhân viên BIGLIGHT sẽ kiểm tra và trả lời bạn trong thời gian sớm nhất.";

// Ngôn ngữ hiển thị mặc định của ứng viên (đối tượng chính là người Việt).
export const CANDIDATE_LANG = "vi" as const;
export const ADMIN_LANG = "ja" as const;

export const CONV_STATUS_LABEL: Record<ConversationStatus, string> = {
  WAITING: "返信待ち",
  IN_PROGRESS: "対応中",
  DONE: "完了",
};

export const CONV_STATUS_TONE: Record<ConversationStatus, string> = {
  WAITING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  DONE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};
