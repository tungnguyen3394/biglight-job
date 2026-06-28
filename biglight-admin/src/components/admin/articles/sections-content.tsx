"use client";

import { Card, Field, Toggle, Seg, Chips, Meter, Icon } from "./ACMS";
import { TWITTER_CARDS, slugify, type ArticleState } from "@/lib/articleModel";
import { CategoryField } from "./CategoryField";
import type { SeoResult } from "@/lib/seoScore";

type Up = (p: Partial<ArticleState>) => void;

function Counter({ n, min, max }: { n: number; min: number; max: number }) {
  const ok = n >= min && n <= max;
  return <span className="a-count" style={{ marginLeft: "auto", color: ok ? "var(--green)" : n > max ? "var(--red)" : "var(--faint)" }}>{n} / {max}</span>;
}

export function ArticleBasicInfo({ a, up }: { a: ArticleState; up: Up }) {
  return (
    <Card icon="doc" title="基本情報" defaultOpen>
      <div className="a-grid">
        <Field label="タイトル" req><input className="a-inp" value={a.title} onChange={(e) => up({ title: e.target.value })} placeholder="記事のタイトル" /></Field>
        <Field label="スラッグ（URL）">
          <div className="a-row">
            <input className="a-inp" value={a.slug} onChange={(e) => up({ slug: slugify(e.target.value) })} placeholder="article-url" />
            <button type="button" className="a-btn" onClick={() => up({ slug: slugify(a.title) })} title="タイトルから生成"><Icon name="sparkles" /></button>
          </div>
        </Field>
        <Field label="カテゴリ"><CategoryField value={a.category} onChange={(v) => up({ category: v })} /></Field>
        <Field label="サブカテゴリ"><input className="a-inp" value={a.subcategory} onChange={(e) => up({ subcategory: e.target.value })} /></Field>
        <Field label="著者"><input className="a-inp" value={a.author} onChange={(e) => up({ author: e.target.value })} /></Field>
        <Field label="公開日時"><input type="datetime-local" className="a-inp" value={a.publishAt} onChange={(e) => up({ publishAt: e.target.value })} /></Field>
        <Field label="更新日時"><input type="datetime-local" className="a-inp" value={a.updatedAt} onChange={(e) => up({ updatedAt: e.target.value })} /></Field>
        <Field label="タグ"><Chips value={a.tags} onChange={(tags) => up({ tags })} placeholder="タグを入力して Enter" /></Field>
        <Field label="ステータス">
          <Seg value={a.status} onChange={(v) => up({ status: v as ArticleState["status"] })} options={[{ v: "DRAFT", label: "下書き" }, { v: "PUBLISHED", label: "公開" }, { v: "SCHEDULED", label: "予約" }]} />
        </Field>
        <Field label="表示オプション">
          <div className="a-row" style={{ gap: 18 }}>
            <Toggle on={a.pinned} onChange={(v) => up({ pinned: v })} label="固定（Pinned）" />
            <Toggle on={a.featured} onChange={(v) => up({ featured: v })} label="注目（Featured）" />
          </div>
        </Field>
      </div>
    </Card>
  );
}

export function ArticleSEO({ a, up, seo }: { a: ArticleState; up: Up; seo: SeoResult }) {
  return (
    <Card icon="search" title="SEO設定" pill="RankMath" defaultOpen>
      <div className="a-grid">
        <Field label="SEOタイトル" counter={<Counter n={a.seoTitle.length} min={30} max={60} />}><input className="a-inp" value={a.seoTitle} onChange={(e) => up({ seoTitle: e.target.value })} placeholder="検索結果に表示されるタイトル" /></Field>
        <Field label="メタディスクリプション" counter={<Counter n={a.metaDescription.length} min={120} max={160} />}><textarea className="a-ta" value={a.metaDescription} onChange={(e) => up({ metaDescription: e.target.value })} placeholder="検索結果に表示される説明文（120〜160文字）" /></Field>
        <Field label="フォーカスキーワード"><input className="a-inp" value={a.focusKeyword} onChange={(e) => up({ focusKeyword: e.target.value })} placeholder="例）特定技能 介護" /></Field>
        <Field label="サブキーワード"><input className="a-inp" value={a.secondaryKeyword} onChange={(e) => up({ secondaryKeyword: e.target.value })} /></Field>
        <Field label="関連キーワード"><Chips value={a.relatedKeywords} onChange={(relatedKeywords) => up({ relatedKeywords })} placeholder="Enter で追加" /></Field>
        <Field label="Canonical URL"><input className="a-inp" value={a.canonical} onChange={(e) => up({ canonical: e.target.value })} placeholder="https://job.biglight.jp/..." /></Field>
        <Field label="Robots（インデックス）"><Seg value={a.robotsIndex ? "index" : "noindex"} onChange={(v) => up({ robotsIndex: v === "index" })} options={[{ v: "index", label: "Index" }, { v: "noindex", label: "Noindex" }]} /></Field>
        <Field label="Robots（フォロー）"><Seg value={a.robotsFollow ? "follow" : "nofollow"} onChange={(v) => up({ robotsFollow: v === "follow" })} options={[{ v: "follow", label: "Follow" }, { v: "nofollow", label: "Nofollow" }]} /></Field>
      </div>

      <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 10 }}>リアルタイム分析</div>
        <div className="a-grid">
          {seo.metrics.map((m) => (
            <div key={m.key} className="full" style={{ display: "grid", gridTemplateColumns: "130px 1fr 90px", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{m.label}</span>
              <Meter ratio={m.ratio} tone={m.ok ? "green" : "amber"} />
              <span style={{ fontSize: 11, fontWeight: 700, color: m.ok ? "var(--green)" : "var(--faint)", textAlign: "right" }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ArticleSummary({ a, up }: { a: ArticleState; up: Up }) {
  return (
    <Card icon="list" title="抜粋（Summary）" defaultOpen={false}>
      <Field label="Excerpt" hint="120〜160文字程度。一覧・OG・AI検索の要約に使われます。" counter={<Counter n={a.excerpt.length} min={120} max={160} />}>
        <textarea className="a-ta" value={a.excerpt} onChange={(e) => up({ excerpt: e.target.value })} placeholder="記事の要約" />
      </Field>
    </Card>
  );
}

export function FeaturedImage({ a, up }: { a: ArticleState; up: Up }) {
  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) up({ featuredImage: URL.createObjectURL(f) });
  }
  return (
    <Card icon="image" title="アイキャッチ画像" defaultOpen={false}>
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 14, alignItems: "start" }}>
        <div>
          <div style={{ aspectRatio: "16/9", borderRadius: 10, border: "1px solid var(--border)", background: "var(--soft)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)" }}>
            {a.featuredImage ? <img src={a.featuredImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="image" size={26} />}
          </div>
          <label className="a-btn block" style={{ marginTop: 8, cursor: "pointer" }}>
            <Icon name="plus" />アップロード<input type="file" accept="image/*" hidden onChange={pick} />
          </label>
          <div className="a-row" style={{ marginTop: 6, gap: 6 }}>
            <button type="button" className="a-btn" style={{ flex: 1 }} disabled title="近日対応">クロップ</button>
            <button type="button" className="a-btn" style={{ flex: 1 }} disabled title="近日対応">圧縮</button>
          </div>
        </div>
        <div className="a-grid one">
          <Field label="画像URL"><input className="a-inp" value={a.featuredImage} onChange={(e) => up({ featuredImage: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Alt テキスト" req><input className="a-inp" value={a.featuredAlt} onChange={(e) => up({ featuredAlt: e.target.value })} placeholder="画像の説明（SEO必須）" /></Field>
          <Field label="キャプション"><input className="a-inp" value={a.featuredCaption} onChange={(e) => up({ featuredCaption: e.target.value })} /></Field>
          <Field label="画像タイトル"><input className="a-inp" value={a.featuredTitle} onChange={(e) => up({ featuredTitle: e.target.value })} /></Field>
          <Field><Toggle on={a.lazyLoad} onChange={(v) => up({ lazyLoad: v })} label="遅延読み込み（Lazy Load）" /></Field>
        </div>
      </div>
    </Card>
  );
}

export function OpenGraph({ a, up }: { a: ArticleState; up: Up }) {
  const ogt = a.ogTitle || a.seoTitle || a.title;
  const ogd = a.ogDescription || a.metaDescription;
  const ogi = a.ogImage || a.featuredImage;
  return (
    <Card icon="share" title="Open Graph / SNS" defaultOpen={false}>
      <div className="a-grid">
        <Field label="OG タイトル"><input className="a-inp" value={a.ogTitle} onChange={(e) => up({ ogTitle: e.target.value })} placeholder={a.seoTitle || "未入力ならSEOタイトルを使用"} /></Field>
        <Field label="OG ディスクリプション"><textarea className="a-ta" value={a.ogDescription} onChange={(e) => up({ ogDescription: e.target.value })} /></Field>
        <Field label="OG 画像URL"><input className="a-inp" value={a.ogImage} onChange={(e) => up({ ogImage: e.target.value })} placeholder={a.featuredImage || "未入力ならアイキャッチを使用"} /></Field>
        <Field label="Twitter Card"><Seg value={a.twitterCard} onChange={(v) => up({ twitterCard: v })} options={TWITTER_CARDS.map((t) => ({ v: t, label: t === "summary_large_image" ? "Large" : "Summary" }))} /></Field>
      </div>
      <div style={{ marginTop: 12, borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", maxWidth: 360 }}>
        <div style={{ aspectRatio: "1.91/1", background: "var(--soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)" }}>
          {ogi ? <img src={ogi} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="image" size={24} />}
        </div>
        <div style={{ padding: "10px 12px", background: "var(--card)" }}>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase" }}>job.biglight.jp</div>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, margin: "2px 0" }}>{ogt || "OG タイトル"}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ogd || "OG ディスクリプション"}</div>
        </div>
      </div>
    </Card>
  );
}
