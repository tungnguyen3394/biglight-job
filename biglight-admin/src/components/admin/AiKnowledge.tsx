"use client";

import { useEffect, useRef, useState } from "react";

type Doc = { file: string; name: string; type: string; version: string; updatedAt: string; status: "ON" | "OFF"; size: number; order: number };
const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

export default function AiKnowledge() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // form upload đang chờ (sau khi chọn file)
  const [pending, setPending] = useState<{ file: string; content: string } | null>(null);
  const [pType, setPType] = useState("Handbook");
  const [pVer, setPVer] = useState("1.0");
  const addRef = useRef<HTMLInputElement>(null);
  const replRef = useRef<HTMLInputElement>(null);
  const replFile = useRef<Doc | null>(null);

  async function load() {
    try {
      const j = await fetch("/api/admin/knowledge").then((r) => r.json());
      setDocs(j.docs || []); setTypes(j.types || []);
    } catch { /* ignore */ }
    setLoaded(true);
  }
  useEffect(() => { load(); }, []);

  async function onAddFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (!/\.(md|txt)$/i.test(f.name)) { setMsg(".md または .txt のみ対応しています。"); return; }
    setMsg(""); setPending({ file: f.name, content: await f.text() }); setPType("Handbook"); setPVer("1.0");
  }

  async function upload() {
    if (!pending) return;
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: pending.file, name: pending.file.replace(/\.(md|txt)$/i, ""), type: pType, version: pVer, content: pending.content, status: "ON" }) });
    setBusy(false);
    if (r.ok) { setPending(null); load(); } else setMsg((await r.json().catch(() => ({}))).error || "アップロードに失敗しました。");
  }

  async function toggle(d: Doc) {
    const next = d.status === "ON" ? "OFF" : "ON";
    setDocs((p) => p.map((x) => (x.file === d.file ? { ...x, status: next } : x)));
    await fetch("/api/admin/knowledge", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: d.file, status: next }) }).catch(() => {});
  }

  // Đổi thứ tự trong cùng nhóm (không đổi tên file) → gửi reorder = danh sách file mới.
  async function move(list: Doc[], i: number, dir: -1 | 1) {
    const j = i + dir; if (j < 0 || j >= list.length) return;
    const arr = [...list]; [arr[i], arr[j]] = [arr[j], arr[i]];
    const files = arr.map((d) => d.file);
    setDocs((prev) => prev.map((d) => { const idx = files.indexOf(d.file); return idx >= 0 ? { ...d, order: idx } : d; }));
    await fetch("/api/admin/knowledge", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reorder: files }) }).catch(() => {});
  }

  async function del(d: Doc) {
    if (!window.confirm(`「${d.name}」を削除しますか？`)) return;
    await fetch(`/api/admin/knowledge?file=${encodeURIComponent(d.file)}`, { method: "DELETE" }).catch(() => {});
    load();
  }

  function startReplace(d: Doc) { replFile.current = d; replRef.current?.click(); }
  async function onReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ""; const d = replFile.current;
    if (!f || !d) return;
    if (!/\.(md|txt)$/i.test(f.name)) { setMsg(".md または .txt のみ対応しています。"); return; }
    setBusy(true);
    await fetch("/api/admin/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: d.file, name: d.name, type: d.type, version: d.version, content: await f.text(), status: d.status, order: d.order }) }).catch(() => {});
    setBusy(false); load();
  }

  // Nhóm danh sách theo 種類 (preset trước, tự đặt tên sau)
  const grouped: [string, Doc[]][] = (() => {
    const m = new Map<string, Doc[]>();
    for (const d of docs) { const k = d.type || "Other"; if (!m.has(k)) m.set(k, []); m.get(k)!.push(d); }
    const known = types.filter((t) => m.has(t));
    const extra = [...m.keys()].filter((k) => !types.includes(k)).sort((a, b) => a.localeCompare(b, "ja"));
    return [...known, ...extra].map((k) => [k, m.get(k)!]);
  })();

  const card = (d: Doc, list: Doc[], i: number) => (
    <div key={d.file} className="rounded-2xl border border-slate-200 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block truncate text-sm font-black text-ink">📄 {d.name}</span>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500"><span>v{d.version}</span><span>{kb(d.size)}</span><span>{d.updatedAt}</span></div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <span className={`w-7 text-right text-[11px] font-black ${d.status === "ON" ? "text-bl-green" : "text-slate-400"}`}>{d.status}</span>
          <button onClick={() => toggle(d)} aria-label="ON/OFF" className={`relative h-6 w-11 rounded-full transition ${d.status === "ON" ? "bg-bl-green" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${d.status === "ON" ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2.5 text-xs font-bold">
        <button onClick={() => move(list, i, -1)} disabled={i === 0} className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-bl-red disabled:opacity-25" aria-label="上へ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 15 6-6 6 6" /></svg></button>
        <button onClick={() => move(list, i, 1)} disabled={i === list.length - 1} className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-bl-red disabled:opacity-25" aria-label="下へ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg></button>
        <span className="mx-1 h-3 w-px bg-slate-200" />
        <a href={`/api/admin/knowledge/download?file=${encodeURIComponent(d.file)}`} className="text-bl-gray hover:text-bl-red">Download</a>
        <button onClick={() => startReplace(d)} className="text-bl-gray hover:text-bl-red">Replace</button>
        <button onClick={() => del(d)} className="ml-auto text-slate-400 hover:text-red-600">Delete</button>
      </div>
    </div>
  );

  return (
    <>
      <p className="mb-3 text-xs text-slate-500">BIGLIGHTの資料（.md / .txt）を登録・管理します。<b className="text-bl-green">ON</b>の資料はAIが回答時に参照します（OFFは使用しません）。長すぎる場合は一部のみ読み込みます。</p>

      {/* Nút thêm + form pending */}
      <input ref={addRef} type="file" accept=".md,.txt,text/markdown,text/plain" onChange={onAddFile} className="hidden" />
      <input ref={replRef} type="file" accept=".md,.txt,text/markdown,text/plain" onChange={onReplaceFile} className="hidden" />
      <datalist id="kn-types">{types.map((t) => <option key={t} value={t} />)}</datalist>
      {!pending ? (
        <button onClick={() => addRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-bl-red px-3.5 py-2 text-sm font-bold text-bl-red hover:bg-bl-redsoft">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>ファイルを追加
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-bl-line bg-bl-bg p-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-500">ファイル</div>
            <div className="truncate text-sm font-bold text-ink">📄 {pending.file}</div>
          </div>
          <div><div className="text-[11px] font-bold text-slate-500">種類（自由入力可）</div><input list="kn-types" value={pType} onChange={(e) => setPType(e.target.value)} placeholder="Handbook…" className="input h-9 w-36 py-0 text-sm" /></div>
          <div><div className="text-[11px] font-bold text-slate-500">Version</div><input value={pVer} onChange={(e) => setPVer(e.target.value)} className="input h-9 w-20 py-0 text-sm" /></div>
          <div className="flex gap-2">
            <button onClick={upload} disabled={busy} className="btn btn-navy btn-sm disabled:opacity-50">{busy ? "…" : "アップロード"}</button>
            <button onClick={() => setPending(null)} className="btn btn-ghost btn-sm">キャンセル</button>
          </div>
        </div>
      )}
      {msg && <p className="mt-2 text-xs font-semibold text-red-600">{msg}</p>}

      {/* Danh sách — nhóm theo 種類 */}
      <div className="mt-4">
        {!loaded ? <p className="text-sm text-slate-400">読み込み中…</p>
          : docs.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">まだ資料がありません。「ファイルを追加」から .md / .txt を登録できます。</p>
          : grouped.map(([type, list]) => (
            <div key={type} className="mb-4">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-full bg-bl-bluesoft px-2.5 py-0.5 text-xs font-black text-bl-blue">{type}</span>
                <span className="text-[11px] font-bold text-slate-400">{list.length}件</span>
                <span className="ml-1 h-px flex-1 bg-slate-100" />
              </div>
              <div className="space-y-2">{list.map((d, i) => card(d, list, i))}</div>
            </div>
          ))}
      </div>
    </>
  );
}
