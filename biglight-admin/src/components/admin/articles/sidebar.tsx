"use client";

import { Card, Icon, Gauge, Meter } from "./ACMS";
import { scoreTone, type SeoResult } from "@/lib/seoScore";
import type { ArticleState } from "@/lib/articleModel";

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="a-row" style={{ gap: 7, padding: "3px 0" }}>
      <span style={{ color: ok ? "var(--green)" : "var(--faint)", display: "flex", flex: "0 0 auto" }}>
        <Icon name={ok ? "check" : "x"} size={14} />
      </span>
      <span style={{ fontSize: 12, color: ok ? "var(--text)" : "var(--muted)" }}>{label}</span>
    </div>
  );
}

export function SeoScoreCard({ seo }: { seo: SeoResult }) {
  const tone = scoreTone(seo.score);
  const top = seo.checklist.slice(0, 10);
  return (
    <div className="a-card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 10 }}>SEOスコア</div>
      <div className="a-row" style={{ gap: 14, marginBottom: 12 }}>
        <Gauge score={seo.score} tone={tone} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--red)" }}>
            {tone === "green" ? "良好" : tone === "amber" ? "改善の余地あり" : "要改善"}
          </div>
          <div className="hint" style={{ marginTop: 2 }}>{seo.passed}/{seo.total} 項目クリア</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        {top.map((c) => <CheckRow key={c.key} ok={c.ok} label={c.label} />)}
      </div>
    </div>
  );
}

export function SEOChecklist({ seo }: { seo: SeoResult }) {
  const tone = scoreTone(seo.score);
  return (
    <Card icon="shield" title="SEOチェックリスト" pill={`${seo.passed}/${seo.total}`} defaultOpen={false}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        {seo.checklist.map((c) => <CheckRow key={c.key} ok={c.ok} label={c.label} />)}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div className="a-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>総合スコア</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--red)" }}>{seo.score} / 100</span>
        </div>
        <Meter ratio={seo.score / 100} tone={tone} />
      </div>
    </Card>
  );
}

const AI_ACTIONS = [
  { k: "seoTitle", label: "SEOタイトル生成" },
  { k: "meta", label: "メタディスクリプション生成" },
  { k: "readability", label: "読みやすさ改善" },
  { k: "faq", label: "FAQ生成" },
  { k: "cta", label: "CTA生成" },
  { k: "ilinks", label: "内部リンク生成" },
  { k: "related", label: "関連記事生成" },
  { k: "jobs", label: "求人リンク生成" },
  { k: "guides", label: "ガイドリンク生成" },
  { k: "improve", label: "記事全体を改善" },
];

export function AIAssistantPanel({ onAI, busy }: { onAI: (k: string, label: string) => void; busy: string | null }) {
  return (
    <Card icon="sparkles" title="AI SEO アシスタント" pill="Beta" defaultOpen={false}>
      <p className="hint" style={{ marginBottom: 10 }}>ワンクリックで生成・改善。AI検索（ChatGPT / Gemini / AI Overview）最適化。</p>
      <div style={{ display: "grid", gap: 7 }}>
        {AI_ACTIONS.map((x) => (
          <button key={x.k} type="button" className="a-btn block" style={{ justifyContent: "flex-start" }} disabled={busy === x.k} onClick={() => onAI(x.k, x.label)}>
            <Icon name={busy === x.k ? "sparkles" : "sparkles"} size={14} />{busy === x.k ? "生成中…" : x.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function PublishSidebar({
  a, saving, lastSaved, dark, onToggleDark, onSave, onPreview, onPublish, onSchedule, onDuplicate, onDelete,
}: {
  a: ArticleState; saving: boolean; lastSaved: string; dark: boolean; onToggleDark: () => void;
  onSave: () => void; onPreview: () => void; onPublish: () => void; onSchedule: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  return (
    <div className="a-card" style={{ padding: 16 }}>
      <div className="a-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>公開</div>
        <button type="button" className="a-btn" style={{ padding: "5px 8px" }} onClick={onToggleDark} title="ダークモード"><Icon name={dark ? "sun" : "moon"} size={15} /></button>
      </div>
      <div className="a-row" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "var(--muted)" }}>ステータス</span>
        <span style={{ fontWeight: 700 }}>{a.status === "PUBLISHED" ? "公開" : a.status === "SCHEDULED" ? "予約" : "下書き"}</span>
      </div>
      <div className="a-row" style={{ justifyContent: "space-between", fontSize: 11, color: "var(--faint)", marginBottom: 12 }}>
        <span>自動保存</span><span>{saving ? "保存中…" : lastSaved ? `${lastSaved} に保存` : "—"}</span>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <button type="button" className="a-btn primary block" onClick={onPublish}><Icon name="rocket" size={15} />公開する</button>
        <div className="a-row" style={{ gap: 7 }}>
          <button type="button" className="a-btn" style={{ flex: 1 }} onClick={onSave}>下書き保存</button>
          <button type="button" className="a-btn" style={{ flex: 1 }} onClick={onPreview}>プレビュー</button>
        </div>
        <div className="a-row" style={{ gap: 7 }}>
          <button type="button" className="a-btn" style={{ flex: 1 }} onClick={onSchedule}>予約投稿</button>
          <button type="button" className="a-btn" style={{ flex: 1 }} onClick={onDuplicate}>複製</button>
        </div>
        <button type="button" className="a-btn block" style={{ color: "var(--red)" }} onClick={onDelete}><Icon name="x" size={14} />削除</button>
      </div>
      <p className="hint" style={{ marginTop: 10 }}>Ctrl+S 保存 ・ Ctrl+Shift+P 公開 ・ Ctrl+B/I 装飾</p>
    </div>
  );
}
