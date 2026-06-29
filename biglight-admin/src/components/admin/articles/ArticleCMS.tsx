"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACMS_CSS, Card, Icon } from "./ACMS";
import { ArticleBasicInfo, ArticleSEO, ArticleSummary, FeaturedImage, OpenGraph } from "./sections-content";
import { GooglePreview } from "./GooglePreview";
import { ArticleEditor } from "./ArticleEditor";
import { FAQEditor, RelatedContent, CTASection, SchemaSection, AnalyticsCard, type JobOpt } from "./sections-blocks";
import { SeoScoreCard, SEOChecklist, AIAssistantPanel, PublishSidebar } from "./sidebar";
import { computeSeo } from "@/lib/seoScore";
import { makeDefaultArticle, nextId, slugify, type ArticleState } from "@/lib/articleModel";

const textOf = (h: string) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export function ArticleCMS({ jobs, initialId, initialData }: { jobs: JobOpt[]; initialId?: string; initialData?: ArticleState }) {
  const router = useRouter();
  const [a, setA] = useState<ArticleState>(initialData ?? makeDefaultArticle);
  const [articleId, setArticleId] = useState<string | null>(initialId ?? null);
  const [dark, setDark] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [edSync, setEdSync] = useState(0);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creating = useRef(false);

  const up = useCallback((p: Partial<ArticleState>) => setA((prev) => ({ ...prev, ...p })), []);
  const seo = computeSeo(a);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  useEffect(() => { setDark(localStorage.getItem("biglight_admin_dark") === "1"); }, []);

  // lưu thật vào DB (tạo nếu chưa có id, ngược lại cập nhật)
  const savePayload = useCallback(async (state: ArticleState): Promise<boolean> => {
    if (!articleId && creating.current) return false;
    setSaving(true);
    const body = JSON.stringify({ ...state, seoScore: computeSeo(state).score });
    let ok = false;
    try {
      if (articleId) {
        const res = await fetch(`/api/articles/${articleId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body });
        ok = res.ok;
      } else {
        creating.current = true;
        const res = await fetch("/api/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body });
        creating.current = false;
        if (res.ok) { const d = await res.json().catch(() => ({})); if (d.id) setArticleId(d.id); ok = true; }
      }
    } catch { ok = false; }
    setSaving(false);
    if (ok) setLastSaved(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));
    return ok;
  }, [articleId]);

  // autosave (debounce) — chỉ khi có tiêu đề
  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    if (!a.title.trim()) return;
    tRef.current = setTimeout(() => { savePayload(a); }, 1000);
    return () => { if (tRef.current) clearTimeout(tRef.current); };
  }, [a, savePayload]);

  const saveNow = useCallback(async () => { if (!a.title.trim()) { flash("タイトルを入力してください"); return; } const ok = await savePayload(a); flash(ok ? "保存しました" : "保存に失敗しました"); }, [a, savePayload]);
  const publish = useCallback(async () => { if (!a.title.trim()) { flash("タイトルを入力してください"); return; } const next = { ...a, status: "PUBLISHED" as const }; setA(next); const ok = await savePayload(next); flash(ok ? "公開しました" : "公開に失敗しました"); }, [a, savePayload]);

  function toggleDark() { setDark((d) => { localStorage.setItem("biglight_admin_dark", d ? "0" : "1"); return !d; }); }

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

  // AI thật (Claude) — /api/ai/article
  async function onAI(k: string, label: string) {
    setBusy(k);
    let d: { text?: string; faqs?: { q: string; a: string }[]; error?: string } = {};
    try {
      const res = await fetch("/api/ai/article", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: k, article: a }) });
      d = await res.json().catch(() => ({}));
      if (!res.ok) { setBusy(null); flash(d.error || "AIに失敗しました"); return; }
    } catch { setBusy(null); flash("AIに接続できませんでした"); return; }
    setBusy(null);

    if (k === "seoTitle" && d.text) up({ seoTitle: d.text.slice(0, 60) });
    else if (k === "meta" && d.text) up({ metaDescription: d.text.slice(0, 160) });
    else if ((k === "readability" || k === "improve") && d.text) { up({ content: d.text }); setEdSync((v) => v + 1); }
    else if (k === "faq" && d.faqs?.length) up({ faqs: [...a.faqs, ...d.faqs.map((f) => ({ id: nextId("faq"), q: f.q, a: f.a }))] });
    else if (d.text) { up({ content: a.content + `<div class="callout"><b>${label}</b><br>${d.text.replace(/\n/g, "<br>")}</div>` }); setEdSync((v) => v + 1); }
    flash(`${label} を反映しました`);
  }

  useEffect(() => { if (!a.slug && a.title) up({ slug: slugify(a.title) }); /* eslint-disable-next-line */ }, [a.title]);

  async function doDelete() {
    if (articleId) { await fetch(`/api/articles/${articleId}`, { method: "DELETE" }); router.push("/admin/articles"); router.refresh(); }
    else { setA(makeDefaultArticle()); flash("クリアしました"); }
  }

  return (
    <div className={`acms${dark ? " dark" : ""}`} style={{ margin: "-24px", padding: 0, minHeight: "calc(100vh - 64px)" }}>
      <style dangerouslySetInnerHTML={{ __html: ACMS_CSS }} />

      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>記事を{initialId ? "編集" : "作成"}</div>
        <span className="hint">{saving ? "保存中…" : lastSaved ? `保存 ${lastSaved}` : "下書き未保存"}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="a-btn" onClick={preview}><Icon name="globe" size={15} />プレビュー</button>
          <button className="a-btn primary" onClick={publish}><Icon name="rocket" size={15} />公開</button>
        </div>
      </div>

      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="acms-layout">
        <style dangerouslySetInnerHTML={{ __html: "@media(min-width:1100px){.acms-layout{grid-template-columns:1fr 340px!important;align-items:start}.acms-side{position:sticky;top:78px}}" }} />
        <div>
          <ArticleBasicInfo a={a} up={up} />
          <ArticleSEO a={a} up={up} seo={seo} />
          <FeaturedImage a={a} up={up} />
          <OpenGraph a={a} up={up} />
          <ArticleSummary a={a} up={up} />
          <ArticleEditor a={a} up={up} syncSignal={edSync} />
          <FAQEditor a={a} up={up} />
          <RelatedContent a={a} up={up} jobs={jobs} />
          <CTASection a={a} up={up} />
          <SchemaSection a={a} up={up} />
          <AnalyticsCard published={a.status === "PUBLISHED"} />
          <SEOChecklist seo={seo} />
        </div>

        <aside className="acms-side">
          <SeoScoreCard seo={seo} />
          <div style={{ height: 14 }} />
          <Card icon="globe" title="Google プレビュー" defaultOpen><GooglePreview a={a} compact /></Card>
          <PublishSidebar
            a={a} saving={saving} lastSaved={lastSaved} dark={dark} onToggleDark={toggleDark}
            onSave={saveNow} onPreview={preview} onPublish={publish}
            onSchedule={() => { const next = { ...a, status: "SCHEDULED" as const }; setA(next); savePayload(next); flash("予約に設定しました"); }}
            onDuplicate={() => flash("複製は近日対応")}
            onDelete={() => { if (confirm(articleId ? "この記事を削除しますか？" : "下書きをクリアしますか？")) doDelete(); }}
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
