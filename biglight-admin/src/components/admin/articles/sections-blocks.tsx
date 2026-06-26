"use client";

import { Card, Field, Toggle, Chips, Icon } from "./ACMS";
import { CTA_KINDS, nextId, type ArticleState } from "@/lib/articleModel";

type Up = (p: Partial<ArticleState>) => void;
export type JobOpt = { id: string; code: string; title: string };

const GUIDES = [
  { href: "/info", label: "特定技能ガイド（総合）" },
  { href: "/tokutei2", label: "特定技能2号情報" },
];

export function FAQEditor({ a, up }: { a: ArticleState; up: Up }) {
  const add = () => up({ faqs: [...a.faqs, { id: nextId("faq"), q: "", a: "" }] });
  const upd = (id: string, p: Partial<{ q: string; a: string }>) => up({ faqs: a.faqs.map((f) => (f.id === id ? { ...f, ...p } : f)) });
  const del = (id: string) => up({ faqs: a.faqs.filter((f) => f.id !== id) });
  return (
    <Card icon="help" title="FAQ" pill={`${a.faqs.length} ・ Schema自動`} defaultOpen={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {a.faqs.map((f, i) => (
          <div key={f.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
            <div className="a-row" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--faint)" }}>Q{i + 1}</span>
              <button type="button" className="a-btn" style={{ marginLeft: "auto", padding: "5px 8px" }} onClick={() => del(f.id)}><Icon name="x" size={14} /></button>
            </div>
            <input className="a-inp" style={{ marginBottom: 6 }} value={f.q} placeholder="質問" onChange={(e) => upd(f.id, { q: e.target.value })} />
            <textarea className="a-ta" value={f.a} placeholder="回答" onChange={(e) => upd(f.id, { a: e.target.value })} />
          </div>
        ))}
      </div>
      <button type="button" className="a-btn block" style={{ marginTop: 10 }} onClick={add}><Icon name="plus" />FAQを追加</button>
    </Card>
  );
}

export function RelatedContent({ a, up, jobs }: { a: ArticleState; up: Up; jobs: JobOpt[] }) {
  const addJob = (id: string) => { if (id && !a.relatedJobs.includes(id)) up({ relatedJobs: [...a.relatedJobs, id] }); };
  const jobLabel = (id: string) => { const j = jobs.find((x) => x.id === id); return j ? `${j.code} ${j.title}` : id; };
  const addGuide = (href: string) => { if (href && !a.relatedGuides.includes(href)) up({ relatedGuides: [...a.relatedGuides, href] }); };
  const guideLabel = (h: string) => GUIDES.find((g) => g.href === h)?.label ?? h;

  return (
    <Card icon="link" title="関連コンテンツ（BIGLIGHT）" pill="AI提案" defaultOpen={false}>
      {/* 関連求人 */}
      <Field label="関連求人（募集中の求人を末尾に表示）">
        <select className="a-sel" value="" onChange={(e) => { addJob(e.target.value); e.target.value = ""; }}>
          <option value="">求人を選択して追加…</option>
          {jobs.filter((j) => !a.relatedJobs.includes(j.id)).map((j) => <option key={j.id} value={j.id}>{j.code} {j.title}</option>)}
        </select>
        {a.relatedJobs.length > 0 && (
          <div className="a-chips" style={{ marginTop: 7 }}>
            {a.relatedJobs.map((id) => <span key={id} className="a-chip">{jobLabel(id)}<button type="button" onClick={() => up({ relatedJobs: a.relatedJobs.filter((x) => x !== id) })}>×</button></span>)}
          </div>
        )}
      </Field>
      {/* 関連ガイド */}
      <Field label="関連ガイド（特定技能ガイド）">
        <select className="a-sel" value="" onChange={(e) => { addGuide(e.target.value); e.target.value = ""; }}>
          <option value="">ガイドを選択して追加…</option>
          {GUIDES.filter((g) => !a.relatedGuides.includes(g.href)).map((g) => <option key={g.href} value={g.href}>{g.label}</option>)}
        </select>
        {a.relatedGuides.length > 0 && (
          <div className="a-chips" style={{ marginTop: 7 }}>
            {a.relatedGuides.map((h) => <span key={h} className="a-chip">{guideLabel(h)}<button type="button" onClick={() => up({ relatedGuides: a.relatedGuides.filter((x) => x !== h) })}>×</button></span>)}
          </div>
        )}
      </Field>
      <div className="a-grid" style={{ marginTop: 4 }}>
        <Field label="関連記事"><Chips value={a.relatedArticles} onChange={(v) => up({ relatedArticles: v })} placeholder="記事スラッグ/タイトル" /></Field>
        <Field label="関連カテゴリ"><Chips value={a.relatedCategories} onChange={(v) => up({ relatedCategories: v })} placeholder="カテゴリ名" /></Field>
        <Field label="ダウンロード資料（PDF URL）"><Chips value={a.downloads} onChange={(v) => up({ downloads: v })} placeholder="PDFのURL/名称" /></Field>
        <Field label="相談予約ブロック"><Toggle on={a.consultBooking} onChange={(v) => up({ consultBooking: v })} label="記事末尾に相談予約フォームを表示" /></Field>
      </div>
    </Card>
  );
}

export function CTASection({ a, up }: { a: ArticleState; up: Up }) {
  const add = () => up({ ctas: [...a.ctas, { id: nextId("cta"), kind: CTA_KINDS[0], label: CTA_KINDS[0], url: "" }] });
  const upd = (id: string, p: Partial<{ kind: string; label: string; url: string }>) => up({ ctas: a.ctas.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  const del = (id: string) => up({ ctas: a.ctas.filter((c) => c.id !== id) });
  return (
    <Card icon="cta" title="CTA ブロック" pill={`${a.ctas.length}`} defaultOpen={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {a.ctas.map((c) => (
          <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
            <div className="a-grid">
              <Field label="種類"><select className="a-sel" value={c.kind} onChange={(e) => upd(c.id, { kind: e.target.value, label: c.label || e.target.value })}>{CTA_KINDS.map((k) => <option key={k}>{k}</option>)}</select></Field>
              <Field label="ラベル"><input className="a-inp" value={c.label} onChange={(e) => upd(c.id, { label: e.target.value })} /></Field>
              <Field label="リンクURL"><input className="a-inp" value={c.url} onChange={(e) => upd(c.id, { url: e.target.value })} placeholder="/mypage / https://lin.ee/..." /></Field>
            </div>
            <button type="button" className="a-btn" style={{ marginTop: 8 }} onClick={() => del(c.id)}><Icon name="x" size={14} />削除</button>
          </div>
        ))}
      </div>
      <button type="button" className="a-btn block" style={{ marginTop: 10 }} onClick={add}><Icon name="plus" />CTAを追加</button>
    </Card>
  );
}

const SCHEMA_TYPES: { k: keyof ArticleState["schema"]; label: string }[] = [
  { k: "article", label: "Article" }, { k: "faq", label: "FAQ" }, { k: "breadcrumb", label: "Breadcrumb" },
  { k: "organization", label: "Organization" }, { k: "video", label: "Video" }, { k: "howto", label: "HowTo" }, { k: "jobPosting", label: "JobPosting" },
];
export function SchemaSection({ a, up }: { a: ArticleState; up: Up }) {
  return (
    <Card icon="schema" title="構造化データ（JSON-LD）" pill="自動生成" defaultOpen={false}>
      <div className="a-grid">
        {SCHEMA_TYPES.map((t) => (
          <label key={t.k} className="a-row" style={{ cursor: "pointer", padding: "6px 0" }}>
            <Toggle on={a.schema[t.k]} onChange={(v) => up({ schema: { ...a.schema, [t.k]: v } })} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</span>
          </label>
        ))}
      </div>
      <p className="hint" style={{ marginTop: 8 }}>選択したスキーマは公開時に JSON-LD として自動出力されます（AI検索最適化）。</p>
    </Card>
  );
}

export function AnalyticsCard({ published }: { published: boolean }) {
  const stats = [["表示回数", "Impressions"], ["クリック", "Clicks"], ["CTR", "CTR"], ["平均掲載順位", "Position"], ["閲覧数", "Views"]];
  return (
    <Card icon="chart" title="アナリティクス" pill="GSC" defaultOpen={false}>
      {!published ? (
        <div style={{ textAlign: "center", padding: "18px 0", color: "var(--faint)" }}>
          <Icon name="chart" size={26} />
          <p className="hint" style={{ marginTop: 6 }}>公開後に Google Search Console と連携して表示されます。</p>
        </div>
      ) : (
        <div className="a-grid">
          {stats.map(([jp, en]) => (
            <div key={en} className="full" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{jp}</span><span style={{ fontSize: 14, fontWeight: 800 }}>—</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
