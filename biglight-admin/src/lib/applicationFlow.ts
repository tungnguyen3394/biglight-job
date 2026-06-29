// Tiến trình ứng tuyển dùng CHUNG cho user (mypage) và admin (応募進捗) — 6 bước cố định.
// 応募 → 面談 → 面接 → 内定 → ビザ申請中 → 入社  (+ kết thúc: 不採用 / 辞退 / キャンセル)
export const STAGES = ["応募", "面談", "面接", "内定", "ビザ申請中", "入社"] as const;

export const STAGE_OF: Record<string, number> = {
  NEW: 0,
  CONSULTING: 1, DOC_CHECK: 1, CV_SENT: 1,
  INTERVIEW_ARRANGING: 2, INTERVIEW_SCHEDULED: 2, INTERVIEWED: 2,
  OFFER: 3, CONTRACT: 3,
  VISA_APPLYING: 4, VISA_APPROVED: 4,
  JOIN_SCHEDULED: 5, JOINED: 5,
  REJECTED: 0, DECLINED: 0, CANCELLED: 0,
};

export const ENDED_STATUSES = new Set(["REJECTED", "DECLINED", "CANCELLED"]);
export const stageOf = (s: string): number => STAGE_OF[s] ?? 0;
export const isEnded = (s: string): boolean => ENDED_STATUSES.has(s);

// 1 mốc trong dòng thời gian tiến trình (mỗi bước có ghi chú đính kèm).
export type FlowEvent = { status: string; label: string; at: string; memo: string | null };
