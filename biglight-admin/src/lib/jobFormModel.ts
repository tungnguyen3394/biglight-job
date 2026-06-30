// Model dùng chung cho form tạo/sửa求人 (đúng cấu trúc biglight-job-admin-post.html),
// Live Preview, API lưu, và trang ứng viên đọc lại.

export const FIELDS = ["工業製品製造業", "建設業", "飲食料品製造業", "外食業", "介護業", "宿泊", "ビルクリーニング", "農業", "漁業", "自動車整備", "造船・舶用工業", "航空", "自動車運送業", "鉄道", "林業", "木材産業"];
export const PREFS = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];
export const PAY_TYPES = ["時給", "日給", "月給"];
export const STD_BENEFITS = ["社会保険完備", "交通費支給", "制服貸与", "賞与あり", "寮完備", "送迎あり", "食事補助", "資格取得支援", "日本語学習サポート"];
export const STD_TAGS = ["寮あり", "個室寮", "未経験OK", "高収入", "駅近", "賞与あり", "土日休み", "日本語不問", "特定技能2号可", "送迎あり", "女性活躍", "長期歓迎", "残業少なめ", "家賃補助"];
export const JP_LEVELS = ["不問", "N5", "N4", "N3", "N2", "N1"];
export const START_OPTS = ["即日", "1ヶ月以内", "1〜3ヶ月", "3ヶ月以上", "応相談"];
export const HOUSE_TYPES = ["アパート寮", "一戸建て寮", "マンション", "社宅", "自分で手配"];
export const CODEPREF: Record<string, string> = { "工業製品製造業": "MFG", "建設業": "CON", "飲食料品製造業": "FBM", "外食業": "FSV", "介護業": "CARE", "宿泊": "HTL", "ビルクリーニング": "CLN", "農業": "AGR", "漁業": "FSH", "自動車整備": "AUTO", "造船・舶用工業": "SHIP", "航空": "AIR", "自動車運送業": "TRK", "鉄道": "RAIL", "林業": "FRST", "木材産業": "WOOD" };

export type Num = number | "";
export type Allowance = { name: string; amount: Num; note: string };
export const ALLOWANCE_SUGGEST = ["皆勤手当", "夜勤手当", "住宅手当", "家族手当", "資格手当", "その他"];

export type JobFormState = {
  // ① 基本情報
  companyId: string;
  code: string;          // 求人コード (admin tự đặt; trống → auto khi tạo)
  recruitStatus: string; // "URGENT" | "OPEN" | "CLOSED" → 急募 / 募集中 / 終了
  field: string;       // → industry
  type: string;        // → jobTypeName (職種)
  title: string;
  pref: string;        // → location
  city: string;
  // 募集人数 (đầu ③)
  recruitTotal: Num;
  recruitMale: Num;
  recruitFemale: Num;
  // ② 給与
  payType: string;
  payAmount: Num;          // 金額（区分に対応）
  workDays: Num;           // 日数/月
  workHoursPerDay: Num;    // 時間/日
  overtimeMonthly: Num;    // 残業時間/月（数値）
  overtimeRate: Num;       // 残業割増率（既定1.25）
  allowances: Allowance[]; // 各種手当
  takehome: Num;           // 手取り月収（手入力）
  payNote: string;
  // ③ 募集要項
  term: string;
  hours: string;
  overtime: string;
  holiday: string;
  commute: string;
  bonus: string;
  benefits: string[];
  // ④ 仕事内容
  desc: string;
  appeal: string[];
  active: string[];
  // ⑤ 応募条件
  jp: string;
  quals: string[];
  start: string;
  // ⑥ 住居・生活
  houseType: string;
  room: string;        // 個室 / 相部屋
  roommates: Num;
  roomDesc: string;
  rent: Num;
  utility: string;
  internet: string;
  otherCost: string;
  // ⑦ 近隣
  nearby: string[];
  // ⑧ タグ
  tags: string[];
  // 公開 / 表示
  publicStatus: string;
  isFeatured: boolean;
  isRecommended: boolean;
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
  // 社内メモ (admin only — KHÔNG vào formData/preview)
  internalMemo: string;
  companyHistory: string;
  riskNotes: string;
};

export function makeDefaultForm(companyId = ""): JobFormState {
  return {
    companyId, code: "", recruitStatus: "OPEN", field: FIELDS[0], type: "", title: "", pref: "愛知県", city: "",
    recruitTotal: "", recruitMale: "", recruitFemale: "",
    payType: "時給", payAmount: "", workDays: 22, workHoursPerDay: 8, overtimeMonthly: "", overtimeRate: 1.25, allowances: [], takehome: "", payNote: "",
    term: "特定技能1号（通算上限5年）", hours: "", overtime: "", holiday: "", commute: "", bonus: "", benefits: [],
    desc: "", appeal: [], active: [],
    jp: "不問", quals: [], start: "応相談",
    houseType: "アパート寮", room: "個室", roommates: "", roomDesc: "", rent: "", utility: "", internet: "", otherCost: "",
    nearby: [], tags: [],
    publicStatus: "DRAFT",
    isFeatured: false, isRecommended: false, imageUrl: "", seoTitle: "", seoDescription: "",
    internalMemo: "", companyHistory: "", riskNotes: "",
  };
}

const N = (v: Num) => (v === "" || v == null ? null : Number(v));
const lines = (a: string[]) => a.map((x) => x.trim()).filter(Boolean);

// Tự tính lương từ thông tin cơ bản. 四捨五入 (Math.round) về số nguyên 円.
export type SalaryCalc = { hourly: number; monthlyBase: number; allowanceTotal: number; overtimePay: number; gross: number };
export function computeSalary(s: JobFormState): SalaryCalc {
  const amt = N(s.payAmount) ?? 0;
  const days = N(s.workDays) ?? 0;
  const hpd = N(s.workHoursPerDay) ?? 0;
  const otH = N(s.overtimeMonthly) ?? 0;
  const rate = N(s.overtimeRate) ?? 1.25;
  let hourly = 0, monthlyBase = 0;
  if (s.payType === "時給") { hourly = amt; monthlyBase = Math.round(amt * days * hpd); }
  else if (s.payType === "日給") { hourly = hpd ? Math.round(amt / hpd) : 0; monthlyBase = Math.round(amt * days); }
  else { monthlyBase = amt; hourly = (days && hpd) ? Math.round(amt / days / hpd) : 0; } // 月給
  const allowanceTotal = (s.allowances || []).reduce((sum, a) => sum + (N(a.amount) ?? 0), 0);
  const overtimePay = Math.round(hourly * rate * otH);
  const gross = monthlyBase + allowanceTotal + overtimePay;
  return { hourly, monthlyBase, allowanceTotal, overtimePay, gross };
}

// Phần public của form → lưu vào cột formData (KHÔNG gồm 社内メモ)
export function publicFormData(s: JobFormState) {
  return {
    field: s.field, type: s.type, title: s.title, pref: s.pref, city: s.city,
    recruitTotal: s.recruitTotal, recruitMale: s.recruitMale, recruitFemale: s.recruitFemale,
    payType: s.payType, payAmount: s.payAmount,
    workDays: s.workDays, workHoursPerDay: s.workHoursPerDay, overtimeMonthly: s.overtimeMonthly, overtimeRate: s.overtimeRate,
    allowances: s.allowances, takehome: s.takehome, payNote: s.payNote, salary: computeSalary(s),
    term: s.term, hours: s.hours, overtime: s.overtime, holiday: s.holiday, commute: s.commute, bonus: s.bonus, benefits: s.benefits,
    desc: s.desc, appeal: lines(s.appeal), active: lines(s.active),
    jp: s.jp, quals: lines(s.quals), start: s.start,
    houseType: s.houseType, room: s.room, roommates: s.roommates, roomDesc: s.roomDesc, rent: s.rent, utility: s.utility, internet: s.internet, otherCost: s.otherCost,
    nearby: lines(s.nearby), tags: s.tags,
  };
}

// Form → payload gửi API (cột thật + formData). Cột thật để bảng/lọc/ứng viên dùng.
export function formToPayload(s: JobFormState, mode: "create" | "edit") {
  const gross = computeSalary(s).gross || null; // 総支給 (tự tính) → thay 月収例
  const payload: Record<string, unknown> = {
    companyId: s.companyId,
    industry: s.field,
    jobTypeName: s.type || null,
    title: s.title.trim() || s.type.trim() || "（無題の求人）",
    location: s.pref,
    city: s.city || null,
    recruitCount: N(s.recruitTotal) ?? 1,
    recruitMale: N(s.recruitMale) ?? 0,
    recruitFemale: N(s.recruitFemale) ?? 0,
    payType: s.payType,
    baseSalary: N(s.payAmount),
    expectedMonthly: gross,
    expectedTakeHome: N(s.takehome),
    salaryMin: gross,
    salaryMax: gross,
    workHours: s.hours || null,
    overtimeHours: N(s.overtimeMonthly) != null ? `月平均${N(s.overtimeMonthly)}時間` : null,
    holidays: s.holiday || null,
    bonus: s.bonus || null,
    commuteMethod: s.commute || null,
    japaneseLevel: s.jp || null,
    description: s.desc || null,
    appealPoints: lines(s.appeal).join("\n") || null,
    requiredQualification: lines(s.quals).join("\n") || null,
    dormitoryAvailable: s.houseType !== "自分で手配",
    dormitoryFee: N(s.rent),
    utilitiesCost: s.utility || null,
    wifi: s.internet || null,
    tags: s.tags,
    publicStatus: s.publicStatus,
    isFeatured: s.isFeatured,
    isRecommended: s.isRecommended,
    imageUrl: s.imageUrl || null,
    seoTitle: s.seoTitle || null,
    seoDescription: s.seoDescription || null,
    internalMemo: s.internalMemo || null,
    companyHistory: s.companyHistory || null,
    riskNotes: s.riskNotes || null,
    formData: publicFormData(s),
  };
  // 求人コード: admin tự đặt; trống thì auto khi tạo.
  const codeVal = s.code.trim();
  if (codeVal) payload.code = codeVal;
  else if (mode === "create") payload.code = makeCode(s.field);
  // 募集状況: 急募/募集中 → OPEN (+isUrgent), 終了 → CLOSED.
  payload.status = s.recruitStatus === "CLOSED" ? "CLOSED" : "OPEN";
  payload.isUrgent = s.recruitStatus === "URGENT";
  return payload;
}

export function makeCode(field: string) {
  return `${CODEPREF[field] || "JOB"}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

// Job (DB) → FormState để mở edit. Ưu tiên formData (đủ 100%), fallback cột.
export function jobToForm(job: Record<string, unknown>): JobFormState {
  const d = makeDefaultForm((job.companyId as string) ?? "");
  const fd = (job.formData as Partial<JobFormState> | null) || {};
  const has = fd && typeof fd === "object" && Object.keys(fd).length > 0;
  const s: JobFormState = {
    ...d,
    companyId: (job.companyId as string) ?? "",
    code: (job.code as string) ?? "",
    recruitStatus: job.status === "CLOSED" || job.status === "PAUSED" || job.status === "FILLED" ? "CLOSED" : (job.isUrgent ? "URGENT" : "OPEN"),
    publicStatus: (job.publicStatus as string) ?? "DRAFT",
    isFeatured: !!job.isFeatured,
    isRecommended: !!job.isRecommended,
    imageUrl: (job.imageUrl as string) ?? "",
    seoTitle: (job.seoTitle as string) ?? "",
    seoDescription: (job.seoDescription as string) ?? "",
    internalMemo: (job.internalMemo as string) ?? "",
    companyHistory: (job.companyHistory as string) ?? "",
    riskNotes: (job.riskNotes as string) ?? "",
  };
  if (has) {
    return { ...s, ...(fd as JobFormState), companyId: s.companyId, code: s.code, recruitStatus: s.recruitStatus, publicStatus: s.publicStatus, internalMemo: s.internalMemo, companyHistory: s.companyHistory, riskNotes: s.riskNotes };
  }
  // fallback từ cột (job cũ chưa có formData)
  const str = (k: string) => (job[k] as string) ?? "";
  const num = (k: string): Num => (job[k] == null ? "" : (job[k] as number));
  const arr = (v: string) => (v ? v.split("\n").filter(Boolean) : []);
  return {
    ...s,
    field: str("industry") || d.field,
    type: str("jobTypeName"),
    title: str("title"),
    pref: str("location") || d.pref,
    city: str("city"),
    recruitTotal: num("recruitCount"), recruitMale: num("recruitMale"), recruitFemale: num("recruitFemale"),
    payType: str("payType") || "時給",
    payAmount: num("baseSalary"), takehome: num("expectedTakeHome"),
    hours: str("workHours"), overtime: str("overtimeHours"), holiday: str("holidays"), bonus: str("bonus"), commute: str("commuteMethod"),
    jp: str("japaneseLevel") || "不問",
    desc: str("description"),
    appeal: arr(str("appealPoints")),
    quals: arr(str("requiredQualification")),
    rent: num("dormitoryFee"), utility: str("utilitiesCost"), internet: str("wifi"),
    tags: (job.tags as string[]) ?? [],
  };
}
