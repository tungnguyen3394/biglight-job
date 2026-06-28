// Model bài viết (CMS SEO) — UI-first, chưa cần bảng DB. Autosave localStorage.

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "PINNED" | "FEATURED";

export type FAQItem = { id: string; q: string; a: string };
export type CTAItem = { id: string; kind: string; label: string; url: string };

export type ArticleState = {
  // ① 基本情報
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  author: string;
  publishAt: string;
  updatedAt: string;
  tags: string[];
  status: ArticleStatus;
  pinned: boolean;
  featured: boolean;
  // ② SEO設定
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeyword: string;
  relatedKeywords: string[];
  canonical: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  // ④ Open Graph
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  // ⑤ Featured Image
  featuredImage: string;
  featuredAlt: string;
  featuredCaption: string;
  featuredTitle: string;
  lazyLoad: boolean;
  // ⑥ Summary
  excerpt: string;
  // ⑧ Editor
  content: string; // HTML
  // ⑨ FAQ
  faqs: FAQItem[];
  // ⑩ Related + BIGLIGHT blocks
  relatedArticles: string[];
  relatedGuides: string[];
  relatedJobs: string[];
  relatedCategories: string[];
  downloads: string[];
  consultBooking: boolean;
  // ⑪ CTA
  ctas: CTAItem[];
  // ⑫ Structured Data
  schema: { article: boolean; faq: boolean; breadcrumb: boolean; organization: boolean; video: boolean; howto: boolean; jobPosting: boolean };
};

export const CATEGORIES = ["特定技能ガイド", "ビザ・在留", "仕事・職種", "生活情報", "お知らせ", "成功事例"];
export const CTA_KINDS = ["相談予約", "応募する", "資料ダウンロード", "LINEで相談"];
export const TWITTER_CARDS = ["summary_large_image", "summary"];

// id ổn định không cần Math.random (truyền index/time từ ngoài khi cần)
let _seq = 0;
export const nextId = (prefix = "i") => `${prefix}${++_seq}`;

export function makeDefaultArticle(): ArticleState {
  return {
    title: "", slug: "", category: "", subcategory: "", author: "BIGLIGHT編集部",
    publishAt: "", updatedAt: "", tags: [], status: "DRAFT", pinned: false, featured: false,
    seoTitle: "", metaDescription: "", focusKeyword: "", secondaryKeyword: "", relatedKeywords: [],
    canonical: "", robotsIndex: true, robotsFollow: true,
    ogTitle: "", ogDescription: "", ogImage: "", twitterCard: "summary_large_image",
    featuredImage: "", featuredAlt: "", featuredCaption: "", featuredTitle: "", lazyLoad: true,
    excerpt: "",
    content: "",
    faqs: [],
    relatedArticles: [], relatedGuides: [], relatedJobs: [], relatedCategories: [], downloads: [], consultBooking: true,
    ctas: [],
    schema: { article: true, faq: false, breadcrumb: true, organization: true, video: false, howto: false, jobPosting: false },
  };
}

// slug hoá tiêu đề (ASCII-friendly, fallback romaji-ish: chỉ giữ a-z0-9-)
export function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[\s　]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
