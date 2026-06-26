// Chấm điểm SEO realtime từ ArticleState (không phụ thuộc DOM — dùng regex để chạy cả client).

import type { ArticleState } from "./articleModel";

const textOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const countMatches = (s: string, re: RegExp) => (s.match(re) || []).length;

export type Metric = { key: string; label: string; value: string; ok: boolean; ratio: number };
export type Check = { key: string; label: string; ok: boolean };
export type SeoResult = { score: number; metrics: Metric[]; checklist: Check[]; passed: number; total: number };

export function computeSeo(a: ArticleState): SeoResult {
  const html = a.content || "";
  const text = textOf(html);
  const words = text ? text.split(/\s+/).length : 0;
  const kw = a.focusKeyword.trim().toLowerCase();

  const h1 = countMatches(html, /<h1[\s>]/gi);
  const h2 = countMatches(html, /<h2[\s>]/gi);
  const h3 = countMatches(html, /<h3[\s>]/gi);
  const imgs = html.match(/<img[^>]*>/gi) || [];
  const imgsWithAlt = imgs.filter((t) => /\balt\s*=\s*["'][^"']+["']/i.test(t)).length;
  const links = html.match(/<a[^>]*href\s*=\s*["'][^"']+["'][^>]*>/gi) || [];
  const internal = links.filter((t) => /href\s*=\s*["'](\/(?!\/)|#)/i.test(t)).length;
  const external = links.filter((t) => /href\s*=\s*["']https?:\/\//i.test(t)).length;

  // keyword density (%)
  const kwCount = kw ? countMatches(text.toLowerCase(), new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) : 0;
  const density = words ? (kwCount / words) * 100 : 0;

  const titleLen = a.seoTitle.length;
  const descLen = a.metaDescription.length;

  const metrics: Metric[] = [
    { key: "title", label: "タイトル長", value: `${titleLen} 文字`, ok: titleLen >= 30 && titleLen <= 60, ratio: Math.min(1, titleLen / 60) },
    { key: "desc", label: "ディスクリプション長", value: `${descLen} 文字`, ok: descLen >= 120 && descLen <= 160, ratio: Math.min(1, descLen / 160) },
    { key: "density", label: "キーワード密度", value: `${density.toFixed(1)} %`, ok: density >= 0.5 && density <= 2.5, ratio: Math.min(1, density / 2.5) },
    { key: "heading", label: "見出し構成", value: `H1:${h1} H2:${h2} H3:${h3}`, ok: h1 >= 1 && h2 >= 2, ratio: Math.min(1, (h1 + h2 + h3) / 6) },
    { key: "img", label: "画像SEO（ALT）", value: imgs.length ? `${imgsWithAlt}/${imgs.length}` : "画像なし", ok: imgs.length > 0 && imgsWithAlt === imgs.length, ratio: imgs.length ? imgsWithAlt / imgs.length : 0 },
    { key: "ilink", label: "内部リンク", value: `${internal} 本`, ok: internal >= 2, ratio: Math.min(1, internal / 3) },
  ];

  const has = (s: string) => s.trim().length > 0;
  const checklist: Check[] = [
    { key: "seoTitle", label: "SEOタイトル", ok: titleLen >= 30 && titleLen <= 60 },
    { key: "meta", label: "メタディスクリプション", ok: descLen >= 120 && descLen <= 160 },
    { key: "url", label: "URL（スラッグ）", ok: has(a.slug) },
    { key: "keyword", label: "フォーカスキーワード", ok: has(a.focusKeyword) },
    { key: "h1", label: "H1", ok: h1 >= 1 },
    { key: "h2", label: "H2", ok: h2 >= 1 },
    { key: "h3", label: "H3", ok: h3 >= 1 },
    { key: "ilink", label: "内部リンク", ok: internal >= 1 },
    { key: "elink", label: "外部リンク", ok: external >= 1 },
    { key: "alt", label: "画像ALT", ok: imgs.length === 0 || imgsWithAlt === imgs.length },
    { key: "featured", label: "アイキャッチ画像", ok: has(a.featuredImage) },
    { key: "faq", label: "FAQ", ok: a.faqs.length >= 1 },
    { key: "cta", label: "CTA", ok: a.ctas.length >= 1 },
    { key: "schema", label: "構造化データ", ok: a.schema.article },
    { key: "canonical", label: "Canonical", ok: has(a.canonical) },
    { key: "og", label: "Open Graph", ok: has(a.ogTitle) && has(a.ogImage) },
    { key: "mobile", label: "モバイル対応", ok: true },
    { key: "readability", label: "可読性", ok: words >= 300 },
    { key: "ai", label: "AI品質", ok: words >= 600 && a.faqs.length >= 1 },
  ];

  const passed = checklist.filter((c) => c.ok).length;
  const total = checklist.length;
  const score = Math.round((passed / total) * 100);
  return { score, metrics, checklist, passed, total };
}

export function scoreTone(score: number): "red" | "amber" | "green" {
  return score >= 80 ? "green" : score >= 50 ? "amber" : "red";
}
