import type { Prisma } from "@prisma/client";

const toDate = (s: unknown): Date | null => {
  if (!s || typeof s !== "string") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// Cột chính (để list/lọc) + data (Json) = toàn bộ ArticleState.
export function articleColumns(b: Record<string, unknown>) {
  return {
    title: (b.title as string)?.trim() || "（無題の記事）",
    slug: (b.slug as string) || null,
    status: typeof b.status === "string" ? b.status : "DRAFT",
    category: (b.category as string) || null,
    author: (b.author as string) || null,
    focusKeyword: (b.focusKeyword as string) || null,
    seoScore: typeof b.seoScore === "number" ? b.seoScore : 0,
    publishAt: toDate(b.publishAt),
    data: b as Prisma.InputJsonValue,
  };
}
