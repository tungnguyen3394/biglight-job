import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "スーパー管理者",
  BIGLIGHT_STAFF: "BIGLIGHTスタッフ",
  CTV: "CTV / パートナー",
  COMPANY: "企業",
  CANDIDATE: "応募者",
};

export const PUBLIC_STATUS_LABEL: Record<string, string> = {
  PUBLIC: "公開",
  PRIVATE: "非公開",
  DRAFT: "下書き",
  SUSPENDED: "停止中",
  PENDING_APPROVAL: "承認待ち",
};

export const JOB_OP_STATUS_LABEL: Record<string, string> = {
  OPEN: "募集中",
  PAUSED: "停止中",
  CLOSED: "終了",
  FILLED: "充足",
};

export const RESIDENCE_LABEL: Record<string, string> = {
  TOKUTEI_1: "特定技能1号",
  TOKUTEI_2: "特定技能2号",
  IKUSEI: "育成就労",
  GIJINKOKU: "技人国",
};

export const GENDER_LABEL: Record<string, string> = {
  MALE: "男性",
  FEMALE: "女性",
  ANY: "不問",
};

export const APP_STATUS_LABEL: Record<string, string> = {
  NEW: "新規応募",
  CONSULTING: "相談中",
  DOC_CHECK: "書類確認中",
  CV_SENT: "CV送付済み",
  INTERVIEW_ARRANGING: "面接調整中",
  INTERVIEW_SCHEDULED: "面接予定",
  INTERVIEWED: "面接済み",
  OFFER: "内定",
  CONTRACT: "契約書作成中",
  VISA_APPLYING: "ビザ申請中",
  VISA_APPROVED: "ビザ許可",
  JOIN_SCHEDULED: "入社予定",
  JOINED: "入社済み",
  REJECTED: "不採用",
  DECLINED: "辞退",
  CANCELLED: "キャンセル",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  NOT_YET: "未発生",
  ACCRUED: "発生済み",
  SCHEDULED: "支払予定",
  PAID: "支払済み",
  ON_HOLD: "保留",
  CANCELLED: "キャンセル",
  REFUND: "返金対象",
};

export const REWARD_TYPE_LABEL: Record<string, string> = {
  FIXED: "固定金額",
  MONTHLY_PCT: "月給%",
  ANNUAL_PCT: "年収%",
};

export const PAYMENT_TIMING_LABEL: Record<string, string> = {
  AFTER_VISA: "ビザ許可後",
  AFTER_JOIN: "入社後",
  AFTER_1M: "1ヶ月後",
  AFTER_3M: "3ヶ月後",
};

// Sidebar menu. `roles` = which roles may see the item.
export interface NavItem {
  href: string;
  label: string;
  jp: string;
  roles: Role[];
}

const ALL: Role[] = ["SUPER_ADMIN", "BIGLIGHT_STAFF", "CTV", "COMPANY", "CANDIDATE"];

export const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", jp: "ダッシュボード", roles: ALL },
  { href: "/admin/jobs", label: "Job Management", jp: "求人管理", roles: ALL },
  { href: "/admin/candidates", label: "Candidates", jp: "応募者管理", roles: ["SUPER_ADMIN", "BIGLIGHT_STAFF", "CTV"] },
  { href: "/admin/pipeline", label: "Pipeline", jp: "応募・進捗管理", roles: ["SUPER_ADMIN", "BIGLIGHT_STAFF", "CTV", "COMPANY"] },
  { href: "/admin/companies", label: "Companies", jp: "企業管理", roles: ["SUPER_ADMIN", "BIGLIGHT_STAFF"] },
  { href: "/admin/partners", label: "Partners", jp: "CTV管理", roles: ["SUPER_ADMIN", "BIGLIGHT_STAFF"] },
  { href: "/admin/commissions", label: "Commission", jp: "報酬管理", roles: ["SUPER_ADMIN", "BIGLIGHT_STAFF", "CTV"] },
  { href: "/admin/users", label: "Users", jp: "ユーザー管理", roles: ["SUPER_ADMIN"] },
  { href: "/admin/settings", label: "Settings", jp: "設定", roles: ["SUPER_ADMIN", "BIGLIGHT_STAFF"] },
];
