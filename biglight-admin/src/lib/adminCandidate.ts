// Tính プロフィール完成度 cho 応募者詳細 (chỉ dùng trong Admin).
// 16 trường quan trọng, mỗi trường = 1 điểm; quy đổi %.

export type DocFile = { name: string; file: string; size: number };
export type TabKey = "basic" | "visa" | "wish";

export type CompletionInput = {
  name: string | null;
  kana: string | null;
  gender: string | null;
  birthdate: Date | string | null;
  nationality: string | null;
  phone: string | null;
  email: string | null;
  visaType: string | null;
  visaExpiryDate: Date | string | null;
  currentTokuteiField: string | null;
  japaneseLevel: string | null;
  desiredLocation: string | null;
  desiredIndustry: string | null;
  desiredSalary: number | null;
  canChangeJobFrom: Date | string | null;
  documents?: Record<string, DocFile[]> | null;
};

type FieldDef = { key: string; label: string; tab: TabKey; filled: (c: CompletionInput) => boolean };

const truthy = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== "";

export const COMPLETION_FIELDS: FieldDef[] = [
  // 基本情報
  { key: "name", label: "氏名", tab: "basic", filled: (c) => truthy(c.name) },
  { key: "kana", label: "フリガナ", tab: "basic", filled: (c) => truthy(c.kana) },
  { key: "gender", label: "性別", tab: "basic", filled: (c) => c.gender === "MALE" || c.gender === "FEMALE" },
  { key: "birthdate", label: "生年月日", tab: "basic", filled: (c) => !!c.birthdate },
  { key: "nationality", label: "国籍", tab: "basic", filled: (c) => truthy(c.nationality) },
  { key: "phone", label: "電話番号", tab: "basic", filled: (c) => truthy(c.phone) },
  { key: "email", label: "メールアドレス", tab: "basic", filled: (c) => truthy(c.email) },
  // 在留資格
  { key: "visaType", label: "現在の在留資格", tab: "visa", filled: (c) => truthy(c.visaType) },
  { key: "visaExpiryDate", label: "在留期限", tab: "visa", filled: (c) => !!c.visaExpiryDate },
  { key: "currentTokuteiField", label: "特定技能分野", tab: "visa", filled: (c) => truthy(c.currentTokuteiField) },
  { key: "japaneseLevel", label: "日本語レベル", tab: "visa", filled: (c) => truthy(c.japaneseLevel) },
  { key: "zairyu", label: "在留カード画像", tab: "visa", filled: (c) => (c.documents?.zairyu?.length ?? 0) > 0 },
  // 希望条件
  { key: "desiredLocation", label: "希望勤務地", tab: "wish", filled: (c) => truthy(c.desiredLocation) },
  { key: "desiredIndustry", label: "希望職種", tab: "wish", filled: (c) => truthy(c.desiredIndustry) },
  { key: "desiredSalary", label: "希望給与", tab: "wish", filled: (c) => (c.desiredSalary ?? 0) > 0 },
  { key: "canChangeJobFrom", label: "転職可能時期", tab: "wish", filled: (c) => !!c.canChangeJobFrom },
];

export type Completion = {
  pct: number;
  filled: number;
  total: number;
  missing: { key: string; label: string; tab: TabKey }[];
  status: "対応可能" | "情報不足";
};

export function computeCompletion(c: CompletionInput): Completion {
  const total = COMPLETION_FIELDS.length;
  const missing: Completion["missing"] = [];
  let filled = 0;
  for (const f of COMPLETION_FIELDS) {
    if (f.filled(c)) filled++;
    else missing.push({ key: f.key, label: f.label, tab: f.tab });
  }
  const pct = Math.round((filled / total) * 100);
  return { pct, filled, total, missing, status: pct >= 80 ? "対応可能" : "情報不足" };
}
