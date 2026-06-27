// 応募進捗 — 8 trạng thái pipeline + map mọi ApplicationStatus → 1 bucket.
export const PIPELINE_STATUSES = ["NEW", "CONSULTING", "INTERVIEW_SCHEDULED", "OFFER", "VISA_APPLYING", "JOINED", "REJECTED", "DECLINED"] as const;
export type PipeStatus = (typeof PIPELINE_STATUSES)[number];

export const PIPE_LABEL: Record<string, string> = {
  NEW: "新規応募", CONSULTING: "面談", INTERVIEW_SCHEDULED: "面接", OFFER: "内定",
  VISA_APPLYING: "ビザ申請", JOINED: "入社", REJECTED: "不採用", DECLINED: "辞退",
};

export const PIPE_TONE: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-600", CONSULTING: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  INTERVIEW_SCHEDULED: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100", OFFER: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  VISA_APPLYING: "bg-purple-50 text-purple-700 ring-1 ring-purple-100", JOINED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  REJECTED: "bg-red-50 text-red-700 ring-1 ring-red-100", DECLINED: "bg-gray-100 text-gray-500",
};

// Gom 16 status enum → 1 trong 8 bucket.
export function bucket(s: string): PipeStatus {
  switch (s) {
    case "NEW": return "NEW";
    case "CONSULTING": case "DOC_CHECK": case "CV_SENT": return "CONSULTING";
    case "INTERVIEW_ARRANGING": case "INTERVIEW_SCHEDULED": case "INTERVIEWED": return "INTERVIEW_SCHEDULED";
    case "OFFER": case "CONTRACT": return "OFFER";
    case "VISA_APPLYING": case "VISA_APPROVED": return "VISA_APPLYING";
    case "JOIN_SCHEDULED": case "JOINED": return "JOINED";
    case "REJECTED": return "REJECTED";
    case "DECLINED": case "CANCELLED": return "DECLINED";
    default: return "NEW";
  }
}
