"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACMS_CSS, Card, Icon } from "./ACMS";
import { ArticleBasicInfo, ArticleSEO, ArticleSummary, FeaturedImage, OpenGraph } from "./sections-content";
import { GooglePreview } from "./GooglePreview";
import { ArticleEditor } from "./ArticleEditor";
import { FAQEditor, RelatedContent, CTASection, SchemaSection, AnalyticsCard, type JobOpt } from "./sections-blocks";
import { SeoScoreCard, SEOChecklist, AIAssistantPanel, PublishSidebar } from "./sidebar";
import { computeSeo } from "@/lib/seoScore";
import { makeDefaultArticle, nextId, slugify, type ArticleState } from "@/lib/articleModel";

const KEY = "biglight_article_draft";
const textOf = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export function ArticleCMS({ jobs }: { jobs: JobOpt[] }) {
  const [a, setA] = useState<ArticleState>(makeDefaultArticle);
  const [dark, setDark] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const up = useCallback((p: Partial<ArticleState>) => setA((prev) => ({ ...prev, ...p })), []);
  const seo = computeSeo(a);

  // load draft + theme once
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setA({ ...makeDefaultArticle(), ...JSON.parse(raw) }); } catch {}
    setDark(localStorage.getItem("biglight_admin_dark") === "1");
  }, []);

  // autosave (debounce)
  useEffect(() => {
    setSaving(true);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {}
      setSaving(false);
      setLastSaved(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));
    }, 800);
    return () => { if (tRef.current) clearTimeout(tRef.current); };
  }, [a]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const saveNow = useCallback(() => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {}; setLastSaved(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })); flash("下書きを保存しました"); }, [a]);
  const publish = useCallback(() => { up({ status: "PUBLISHED" }); flash("公開しました（プロトタイプ：ローカル保存）"); }, [up]);

  function toggleDark() { setDark((d) => { localStorage.setItem("biglight_admin_dark", d ? "0" : "1"); return !d; }); }

  // keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !e.shiftKey) { e.preventDefault(); saveNow(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); publish(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [saveNow, publish]);

  function preview() {
    const w = window.open("", "_blank", "width=900,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${a.seoTitle || a.title}</title><style>body{font-family:'Noto Sans JP',sans-serif;max-width:720px;margin:30px auto;padding:0 20px;line-height:1.8;color:#16181d}h1{font-size:30px}h2{border-left:4px solid #D02E26;padding-left:9px}img{max-width:100%}</style><h1>${a.title}</h1>${a.featuredImage ? `<img src="${a.featuredImage}">` : ""}${a.content}`);
    w.document.close();
  }

  function onAI(k: string, label: string) {
    setBusy(k);
    setTimeout(() => {
      if (k === "seoTitle") up({ seoTitle: (a.title || "BIGLIGHT Job").slice(0, 60) });
      else if (k === "meta") up({ metaDescription: (a.excerpt || textOf(a.content)).slice(0, 158) });
      else if (k === "faq") up({ faqs: [...a.faqs, { id: nextId("faq"), q: "特定技能で日本に行くには？", a: "" }, { id: nextId("faq"), q: "費用はどのくらいかかりますか？", a: "" }] });
      else if (k === "cta") up({ ctas: [...a.ctas, { id: nextId("cta"), kind: "相談予約", label: "無料で相談する", url: "/mypage" }] });
      else if (k === "jobs") flash("「関連求人」セクションで募集中の求人を選べます。");
      else if (k === "guides") flash("「関連コンテンツ」でガイドを追加できます。");
      else flash(`${label}：AI連携は近日対応（API接続後に有効化）`);
      if (["seoTitle", "meta", "faq", "cta"].includes(k)) flash(`${label} を反映しました`);
      setBusy(null);
    }, 500);
  }

  // auto slug nếu chưa nhập
  useEffect(() => { if (!a.slug && a.title) up({ slug: slugify(a.title) }); /* eslint-disable-next-line */ }, [a.title]);

  return (
    <div className={`acms${dark ? " dark" : ""}`} style={{ margin: "-24px", padding: 0, minHeight: "calc(100vh - 64px)" }}>
      <style dangerouslySetInnerHTML={{ __html: ACMS_CSS }} />

      {/* sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>記事を作成</div>
        <span className="hint">{saving ? "保存中…" : lastSaved ? `自動保存 ${lastSaved}` : "新規"}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="a-btn" onClick={preview}><Icon name="globe" size={15} />プレビュー</button>
          <button className="a-btn primary" onClick={publish}><Icon name="rocket" size={15} />公開</button>
        </div>
      </div>

      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="acms-layout">
        <style dangerouslySetInnerHTML={{ __html: "@media(min-width:1100px){.acms-layout{grid-template-columns:1fr 340px!important;align-items:start}.acms-side{position:sticky;top:78px}}" }} />
        {/* MAIN */}
        <div>
          <ArticleBasicInfo a={a} up={up} />
          <ArticleSEO a={a} up={up} seo={seo} />
          <Card icon="globe" title="Google プレビュー" defaultOpen><GooglePreview a={a} /></Card>
          <OpenGraph a={a} up={up} />
          <FeaturedImage a={a} up={up} />
          <ArticleSummary a={a} up={up} />
          <ArticleEditor a={a} up={up} />
          <FAQEditor a={a} up={up} />
          <RelatedContent a={a} up={up} jobs={jobs} />
          <CTASection a={a} up={up} />
          <SchemaSection a={a} up={up} />
          <AnalyticsCard published={a.status === "PUBLISHED"} />
          <SEOChecklist seo={seo} />
        </div>

        {/* SIDEBAR (sticky) */}
        <aside className="acms-side">
          <SeoScoreCard seo={seo} />
          <div style={{ height: 14 }} />
          <Card icon="globe" title="Google プレビュー" defaultOpen><GooglePreview a={a} compact /></Card>
          <PublishSidebar
            a={a} saving={saving} lastSaved={lastSaved} dark={dark} onToggleDark={toggleDark}
            onSave={saveNow} onPreview={preview} onPublish={publish}
            onSchedule={() => { up({ status: "SCHEDULED" }); flash("予約に設定しました"); }}
            onDuplicate={() => flash("複製（保存後に有効化）")}
            onDelete={() => { if (confirm("この下書きを削除しますか？")) { localStorage.removeItem(KEY); setA(makeDefaultArticle()); flash("削除しました"); } }}
          />
          <AIAssistantPanel onAI={onAI} busy={busy} />
        </aside>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "var(--text)", color: "var(--bg)", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>{toast}</div>
      )}
    </div>
  );
}
