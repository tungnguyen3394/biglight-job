"use client";

import type { ArticleState } from "@/lib/articleModel";

export function GooglePreview({ a, compact }: { a: ArticleState; compact?: boolean }) {
  const title = a.seoTitle || a.title || "記事タイトル";
  const desc = a.metaDescription || a.excerpt || "検索結果に表示される説明文がここに表示されます。";
  const url = `job.biglight.jp › ${a.category || "blog"}${a.slug ? " › " + a.slug : ""}`;

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: compact ? 10 : 12, padding: compact ? 12 : 16 }}>
      <div className="a-row" style={{ gap: 8, marginBottom: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "var(--accent)" }}>B</span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>BIGLIGHT Job</div>
          <div style={{ fontSize: 11, color: "var(--muted)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</div>
        </div>
      </div>
      <div style={{ fontSize: compact ? 15 : 18, lineHeight: 1.3, color: "#1a0dab", fontWeight: 500, marginBottom: 3, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</div>
    </div>
  );
}
