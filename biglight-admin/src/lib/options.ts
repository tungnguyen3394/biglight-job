import { prisma } from "./prisma";
import { NATIONALITIES, VISA_TYPES, JP_LEVELS } from "./candidateFields";
import { FIELDS, STD_TAGS } from "./jobFormModel";
import { SSW_JOBS, type SswField } from "./sswJobs";

export type OptionKey = "nationality" | "visa" | "jpLevel" | "industry" | "tags" | "guideCategory" | "sswField";

// Danh mục bài viết 特定技能ガイド (dùng chung admin + filter user). Khởi tạo = list user guide cũ.
export const GUIDE_CATEGORY_DEFAULTS = ["特定技能", "ビザ", "求人・転職", "面接対策", "履歴書", "日本語", "日本での生活", "給料・税金", "ニュース"];

// Các danh sách master-data. label = tên hiển thị ở 設定.
export const OPTION_SETS: { key: OptionKey; label: string; hint: string; defaults: string[] }[] = [
  { key: "nationality", label: "国籍", hint: "応募者プロフィールの国籍", defaults: NATIONALITIES },
  { key: "visa", label: "在留資格", hint: "応募者の現在の在留資格", defaults: VISA_TYPES },
  { key: "jpLevel", label: "日本語レベル", hint: "応募者の日本語レベル", defaults: JP_LEVELS },
  { key: "industry", label: "特定技能分野", hint: "求人作成・応募者の希望分野で使う特定技能分野（共通）", defaults: FIELDS },
  { key: "tags", label: "タグ", hint: "求人のタグ", defaults: STD_TAGS },
  { key: "guideCategory", label: "記事カテゴリ", hint: "特定技能ガイドの記事カテゴリ（ユーザー側の絞り込みと共通）", defaults: GUIDE_CATEGORY_DEFAULTS },
  { key: "sswField", label: "特定技能分野（3階層）", hint: "業種 → 業務区分 → 従事する主な業務（応募者プロフィールの分野選択と共通）", defaults: SSW_JOBS.map((f) => f.field) },
];

export const SSW_KEY = "sswField";
const DEFAULTS = Object.fromEntries(OPTION_SETS.map((s) => [s.key, s.defaults])) as Record<OptionKey, string[]>;

// Seed cây 3 tầng (業種→業務区分→従事する主な業務) từ SSW_JOBS.
async function seedSswHierarchy(setId: string): Promise<void> {
  for (let fi = 0; fi < SSW_JOBS.length; fi++) {
    const f = SSW_JOBS[fi];
    const field = await prisma.optionItem.create({ data: { setId, value: f.field, sortOrder: fi } });
    for (let ci = 0; ci < f.categories.length; ci++) {
      const c = f.categories[ci];
      const cat = await prisma.optionItem.create({ data: { setId, value: c.category, sortOrder: ci, parentId: field.id } });
      if (c.mainTasks.length) {
        await prisma.optionItem.createMany({ data: c.mainTasks.map((t, ti) => ({ setId, value: t, sortOrder: ti, parentId: cat.id })) });
      }
    }
  }
}

// Lazy-init: tạo set + item từ default nếu chưa có (gọi khi admin mở 設定).
export async function ensureOptionSets(): Promise<void> {
  for (const s of OPTION_SETS) {
    const existing = await prisma.optionSet.findUnique({ where: { key: s.key }, include: { _count: { select: { items: true } } } });
    if (s.key === SSW_KEY) {
      const set = existing ?? (await prisma.optionSet.create({ data: { key: s.key, label: s.label } }));
      if ((existing?._count.items ?? 0) === 0) await seedSswHierarchy(set.id);
      continue;
    }
    if (!existing) {
      await prisma.optionSet.create({ data: { key: s.key, label: s.label, items: { create: s.defaults.map((v, i) => ({ value: v, sortOrder: i })) } } });
    } else if (existing._count.items === 0) {
      await prisma.optionItem.createMany({ data: s.defaults.map((v, i) => ({ setId: existing.id, value: v, sortOrder: i })) });
    }
  }
}

// Đọc options ĐANG BẬT cho form. Fallback về defaults nếu DB chưa có (an toàn).
// sswField là cây → ở đây chỉ trả tầng gốc (業種); cấu trúc đầy đủ dùng getSswTree().
export async function getAllOptions(): Promise<Record<OptionKey, string[]>> {
  const sets = await prisma.optionSet.findMany({ include: { items: { where: { enabled: true }, orderBy: { sortOrder: "asc" } } } });
  const byKey = new Map(sets.map((s) => [s.key, s.items]));
  const out = {} as Record<OptionKey, string[]>;
  for (const s of OPTION_SETS) {
    const items = byKey.get(s.key) ?? [];
    const vals = s.key === SSW_KEY ? items.filter((i) => !i.parentId).map((i) => i.value) : items.map((i) => i.value);
    out[s.key] = vals.length ? vals : DEFAULTS[s.key];
  }
  return out;
}

// Cây 3 tầng cho form ứng viên (cùng shape với SSW_JOBS). Fallback hằng số nếu DB trống.
export async function getSswTree(): Promise<SswField[]> {
  await ensureOptionSets();
  const set = await prisma.optionSet.findUnique({ where: { key: SSW_KEY }, include: { items: { where: { enabled: true }, orderBy: { sortOrder: "asc" } } } });
  if (!set || set.items.length === 0) return SSW_JOBS;
  const byParent = new Map<string | null, typeof set.items>();
  for (const it of set.items) { const k = it.parentId ?? null; if (!byParent.has(k)) byParent.set(k, []); byParent.get(k)!.push(it); }
  const roots = byParent.get(null) ?? [];
  return roots.map((f) => ({
    field: f.value,
    categories: (byParent.get(f.id) ?? []).map((c) => ({ category: c.value, mainTasks: (byParent.get(c.id) ?? []).map((t) => t.value) })),
  }));
}
