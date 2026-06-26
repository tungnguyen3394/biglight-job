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

export function ArticleEditor({ a, up }: { a: ArticleState; up: Up }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== a.content) ref.current.innerHTML = a.content || ""; /* init once */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  // markdown paste (cơ bản)
  function onPaste(e: React.ClipboardEvent) {
    const t = e.clipboardData.getData("text/plain");
    if (!t || !/(^|\n)\s*(#{1,3}\s|[-*]\s|\d+\.\s)|\*\*[^*]+\*\*/.test(t)) return;
    e.preventDefault();
    const html = t.split(/\n{2,}/).map((blk) => {
      const l = blk.trim();
      if (/^###\s/.test(l)) return `<h3>${l.replace(/^###\s/, "")}</h3>`;
      if (/^##\s/.test(l)) return `<h2>${l.replace(/^##\s/, "")}</h2>`;
      if (/^#\s/.test(l)) return `<h1>${l.replace(/^#\s/, "")}</h1>`;
      if (/^[-*]\s/.test(l)) return `<ul>${l.split("\n").map((x) => `<li>${x.replace(/^[-*]\s/, "")}</li>`).join("")}</ul>`;
      return `<p>${l.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</p>`;
    }).join("");
    insert(html);
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
