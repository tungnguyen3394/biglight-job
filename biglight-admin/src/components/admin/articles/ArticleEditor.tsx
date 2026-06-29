"use client";

import { useEffect, useRef } from "react";
import { Card, Icon } from "./ACMS";
import type { ArticleState } from "@/lib/articleModel";

const EDCSS = `
.a-edtoolbar{display:flex;flex-wrap:wrap;gap:4px;padding:8px;border:1px solid var(--border);border-bottom:none;border-radius:10px 10px 0 0;background:var(--soft);position:sticky;top:60px;z-index:5}
.a-edtoolbar button{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;padding:6px 9px;border-radius:7px;border:none;background:transparent;color:var(--muted);cursor:pointer}
.a-edtoolbar button:hover{background:var(--card);color:var(--text)}
.a-edtoolbar .sep{width:1px;align-self:stretch;background:var(--border);margin:2px 3px}
.a-editor{min-height:340px;border:1px solid var(--border);border-radius:0 0 10px 10px;background:var(--bg);padding:16px 18px;font-size:14px;line-height:1.85;color:var(--text);outline:none}
.a-editor:focus{border-color:var(--accent)}
.a-editor h1{font-size:25px;font-weight:900;margin:.6em 0 .3em}
.a-editor h2{font-size:20px;font-weight:800;margin:.9em 0 .35em;border-left:4px solid var(--accent);padding-left:9px}
.a-editor h3{font-size:16px;font-weight:800;margin:.8em 0 .3em}
.a-editor p{margin:.5em 0}
.a-editor ul,.a-editor ol{margin:.5em 0 .5em 1.4em}
.a-editor blockquote{border-left:3px solid var(--border);padding:4px 14px;color:var(--muted);margin:.6em 0}
.a-editor img{max-width:100%;border-radius:10px;margin:.5em 0}
.a-editor table{border-collapse:collapse;width:100%;margin:.6em 0}
.a-editor td,.a-editor th{border:1px solid var(--border);padding:7px 10px}
.a-editor pre{background:var(--soft);border-radius:8px;padding:12px;overflow:auto;font-size:12.5px}
.a-editor .callout{display:flex;gap:9px;background:var(--accent-soft);border:1px solid var(--border);border-radius:10px;padding:11px 13px;margin:.6em 0}
.a-editor .btn-block{display:inline-block;background:var(--accent);color:#fff;font-weight:700;padding:9px 18px;border-radius:9px;margin:.4em 0}
.a-editor details{border:1px solid var(--border);border-radius:9px;padding:8px 12px;margin:.5em 0}
.a-editor summary{font-weight:700;cursor:pointer}
.a-editor:empty::before{content:'本文を入力…（Markdown 貼り付け対応）';color:var(--faint)}
`;

type Up = (p: Partial<ArticleState>) => void;

// ===== Markdown → HTML (hợp AI: bảng, heading, list, quote, code, **đậm**/*nghiêng*/`code`/[link]) =====
const mdEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function mdInline(s: string): string {
  return mdEsc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}
function looksLikeMarkdown(t: string): boolean {
  return /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```)|\n\s*\|.*\|\s*\n\s*\|?\s*:?-{2,}|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/.test(t);
}
function mdToHtml(src: string): string {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  const cells = (r: string) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) { // code block
      const buf: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; out.push("<pre><code>" + mdEsc(buf.join("\n")) + "</code></pre>"); continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}.*\|/.test(lines[i + 1])) { // table
      const header = line; const rows: string[] = []; i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; }
      const th = cells(header).map((c) => `<th>${mdInline(c)}</th>`).join("");
      const trs = rows.map((r) => `<tr>${cells(r).map((c) => `<td>${mdInline(c)}</td>`).join("")}</tr>`).join("");
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`); continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const lv = Math.min(h[1].length, 6); out.push(`<h${lv}>${mdInline(h[2])}</h${lv}>`); i++; continue; }
    if (/^>\s?/.test(line)) { const buf: string[] = []; while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; } out.push(`<blockquote>${mdInline(buf.join(" "))}</blockquote>`); continue; }
    if (/^\s*\d+\.\s+/.test(line)) { const buf: string[] = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; } out.push("<ol>" + buf.map((x) => `<li>${mdInline(x)}</li>`).join("") + "</ol>"); continue; }
    if (/^\s*[-*+]\s+/.test(line)) { const buf: string[] = []; while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*[-*+]\s+/, "")); i++; } out.push("<ul>" + buf.map((x) => `<li>${mdInline(x)}</li>`).join("") + "</ul>"); continue; }
    if (/^\s*$/.test(line)) { i++; continue; }
    const buf: string[] = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|>\s?|```|\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i]) && !/^\s*\|.*\|\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push(`<p>${buf.map(mdInline).join("<br>")}</p>`);
  }
  return out.join("");
}

export function ArticleEditor({ a, up, syncSignal = 0 }: { a: ArticleState; up: Up; syncSignal?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== a.content) ref.current.innerHTML = a.content || ""; /* init + sync khi AI thay content */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncSignal]);
  const sync = () => up({ content: ref.current?.innerHTML ?? "" });
  const exec = (cmd: string, val?: string) => { ref.current?.focus(); document.execCommand(cmd, false, val); sync(); };
  const insert = (html: string) => { ref.current?.focus(); document.execCommand("insertHTML", false, html); sync(); };

  const insertImage = () => { const u = prompt("画像URL"); if (u) insert(`<img src="${u}" alt="" loading="lazy" />`); };
  const insertLink = () => { const u = prompt("リンクURL（内部は / で開始）"); if (u) exec("createLink", u); };
  const insertYoutube = () => { const u = prompt("YouTube URL または ID"); if (!u) return; const id = (u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/) || [, u])[1]; insert(`<div class="yt"><iframe width="100%" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe></div>`); };
  const toc = () => {
    const hs = Array.from(ref.current?.querySelectorAll("h2,h3") ?? []);
    if (!hs.length) { alert("見出し（H2/H3）がありません。"); return; }
    const items = hs.map((h) => `<li style="margin-left:${h.tagName === "H3" ? 16 : 0}px">${h.textContent}</li>`).join("");
    insert(`<nav class="toc"><b>目次</b><ul>${items}</ul></nav>`);
  };

  // Paste Markdown (AI): tự chuyển bảng / heading / list / quote / code / inline → HTML.
  function onPaste(e: React.ClipboardEvent) {
    const t = e.clipboardData.getData("text/plain");
    const html = e.clipboardData.getData("text/html");
    // Nếu nguồn đã là HTML giàu (copy từ web) → để trình duyệt dán bình thường.
    if (html && /<(table|h[1-6]|ul|ol|p|img)/i.test(html)) return;
    if (!t || !looksLikeMarkdown(t)) return;
    e.preventDefault();
    insert(mdToHtml(t));
  }

  const T = ({ cmd, val, icon, label }: { cmd?: string; val?: string; icon?: string; label?: string }) => (
    <button type="button" title={label} onMouseDown={(e) => { e.preventDefault(); if (cmd) exec(cmd, val); }}>{icon ? <Icon name={icon} size={15} /> : null}{label && !icon ? label : null}</button>
  );

  return (
    <Card icon="doc" title="本文エディター" pill="Rich Text" defaultOpen>
      <style dangerouslySetInnerHTML={{ __html: EDCSS }} />
      <div className="a-edtoolbar">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<h2>"); }} title="見出し2">H2</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<h3>"); }} title="見出し3">H3</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<p>"); }} title="段落">P</button>
        <span className="sep" />
        <T cmd="bold" label="B" /><T cmd="italic" label="I" /><T cmd="underline" label="U" />
        <span className="sep" />
        <T cmd="insertUnorderedList" icon="list" label="箇条書き" /><button type="button" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }}>1.</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "<blockquote>"); }} title="引用">”</button>
        <span className="sep" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertLink(); }} title="リンク"><Icon name="link" size={15} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertImage(); }} title="画像"><Icon name="image" size={15} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertYoutube(); }}>YouTube</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insert('<table><tr><th>見出し</th><th>見出し</th></tr><tr><td>　</td><td>　</td></tr></table>'); }}>表</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insert('<ul><li>☐ 項目</li></ul>'); }}>チェック</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insert('<a class="btn-block" href="#">ボタン</a>'); }}>ボタン</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insert('<div class="callout"><b>POINT</b> テキスト</div>'); }}>Callout</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insert('<details><summary>見出し</summary><p>内容</p></details>'); }}>アコーディオン</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insert('<pre><code>コード</code></pre>'); }}>{"</>"}</button>
        <span className="sep" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); toc(); }}><Icon name="list" size={15} />目次</button>
      </div>
      <div ref={ref} className="a-editor" contentEditable suppressContentEditableWarning onInput={sync} onBlur={sync} onPaste={onPaste} />
    </Card>
  );
}
