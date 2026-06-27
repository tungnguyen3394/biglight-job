import { prisma } from "./prisma";
import { NATIONALITIES, VISA_TYPES, JP_LEVELS } from "./candidateFields";
import { FIELDS, STD_TAGS } from "./jobFormModel";

export type OptionKey = "nationality" | "visa" | "jpLevel" | "industry" | "tags";

// 5 danh sách chính (nền tảng). label = tên hiển thị ở 設定.
export const OPTION_SETS: { key: OptionKey; label: string; hint: string; defaults: string[] }[] = [
  { key: "nationality", label: "国籍", hint: "応募者プロフィールの国籍", defaults: NATIONALITIES },
  { key: "visa", label: "在留資格", hint: "応募者の現在の在留資格", defaults: VISA_TYPES },
  { key: "jpLevel", label: "日本語レベル", hint: "応募者の日本語レベル", defaults: JP_LEVELS },
  { key: "industry", label: "業種", hint: "求人の業種・応募者の希望分野（共通）", defaults: FIELDS },
  { key: "tags", label: "タグ", hint: "求人のタグ", defaults: STD_TAGS },
];

const DEFAULTS = Object.fromEntries(OPTION_SETS.map((s) => [s.key, s.defaults])) as Record<OptionKey, string[]>;

// Lazy-init: tạo set + item từ default nếu chưa có (gọi khi admin mở 設定).
export async function ensureOptionSets(): Promise<void> {
  for (const s of OPTION_SETS) {
    const existing = await prisma.optionSet.findUnique({ where: { key: s.key }, include: { _count: { select: { items: true } } } });
    if (!existing) {
      await prisma.optionSet.create({ data: { key: s.key, label: s.label, items: { create: s.defaults.map((v, i) => ({ value: v, sortOrder: i })) } } });
    } else if (existing._count.items === 0) {
      await prisma.optionItem.createMany({ data: s.defaults.map((v, i) => ({ setId: existing.id, value: v, sortOrder: i })) });
    }
  }
}

// Đọc options ĐANG BẬT cho form. Fallback về defaults nếu DB chưa có (an toàn).
export async function getAllOptions(): Promise<Record<OptionKey, string[]>> {
  const sets = await prisma.optionSet.findMany({ include: { items: { where: { enabled: true }, orderBy: { sortOrder: "asc" } } } });
  const byKey = new Map(sets.map((s) => [s.key, s.items.map((i) => i.value)]));
  const out = {} as Record<OptionKey, string[]>;
  for (const s of OPTION_SETS) {
    const fromDb = byKey.get(s.key as OptionKey);
    out[s.key] = fromDb && fromDb.length ? fromDb : DEFAULTS[s.key];
  }
  return out;
}
