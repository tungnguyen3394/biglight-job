// Trung tâm kiến thức 特定技能ガイド — danh mục + trích dữ liệu thẻ bài viết từ Article.data (CMS).

export const GUIDE_CATEGORIES = [
  "特定技能", "ビザ", "求人・転職", "面接対策", "履歴書", "日本語", "日本での生活", "給料・税金", "ニュース",
] as const;

export type GuideCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string; // ISO
};

type ArticleRow = {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  publishAt: Date | null;
  createdAt: Date;
  data: unknown;
};

export function articleCard(a: ArticleRow): GuideCard {
  const d = (a.data as Record<string, unknown>) || {};
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id: a.id,
    slug: a.slug || a.id,
    title: a.title,
    excerpt: str(d.excerpt) || str(d.metaDescription),
    image: str(d.featuredImage) || str(d.ogImage),
    category: a.category || "",
    date: (a.publishAt ?? a.createdAt).toISOString(),
  };
}

export function articleBodyHtml(data: unknown): string {
  const d = (data as Record<string, unknown>) || {};
  return typeof d.content === "string" ? d.content : "";
}
