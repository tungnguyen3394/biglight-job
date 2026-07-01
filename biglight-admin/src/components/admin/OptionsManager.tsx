"use client";

import { useEffect, useState } from "react";
import { SswTreeEditor } from "./SswTreeEditor";

type Item = { id: string; value: string; enabled: boolean; sortOrder: number; parentId: string | null };
type OptSet = { id: string; key: string; label: string; hint: string; items: Item[] };

export default function OptionsManager() {
  const [sets, setSets] = useState<OptSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");

  async function reload() {
    const r = await fetch("/api/admin/options");
    const j = await r.json().catch(() => ({}));
    if (r.ok) setSets(j.sets || []);
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  async function api(url: string, method: string, body?: unknown) {
    setErr("");
    const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || "エラーが発生しました。"); return false; }
    return true;
  }

  function patchLocal(setId: string, itemId: string, patch: Partial<Item>) {
    setSets((p) => p.map((s) => (s.id === setId ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : s)));
  }

  async function addItem(s: OptSet) {
    const value = (adding[s.id] || "").trim();
    if (!value) return;
    const r = await fetch("/api/admin/options/item", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setId: s.id, value }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.item) {
      setSets((p) => p.map((x) => (x.id === s.id ? { ...x, items: [...x.items, j.item] } : x)));
      setAdding((a) => ({ ...a, [s.id]: "" }));
    } else setErr(j.error || "追加に失敗しました。");
  }
  async function rename(setId: string, item: Item, value: string) {
    if (value.trim() === item.value || !value.trim()) return;
    if (await api(`/api/admin/options/item/${item.id}`, "PATCH", { value })) patchLocal(setId, item.id, { value: value.trim() });
  }
  async function toggle(setId: string, item: Item) {
    if (await api(`/api/admin/options/item/${item.id}`, "PATCH", { enabled: !item.enabled })) patchLocal(setId, item.id, { enabled: !item.enabled });
  }
  async function move(item: Item, dir: "up" | "down") {
    if (await api(`/api/admin/options/item/${item.id}`, "PATCH", { move: dir })) reload();
  }
  async function remove(setId: string, item: Item) {
    if (!window.confirm(`「${item.value}」を削除しますか？`)) return;
    if (await api(`/api/admin/options/item/${item.id}`, "DELETE")) setSets((p) => p.map((s) => (s.id === setId ? { ...s, items: s.items.filter((i) => i.id !== item.id) } : s)));
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">ドロップダウン・タグなどの選択肢を一元管理します。変更は応募者フォーム・求人フォームに反映されます。</p>

      {err && <div className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-100">{err}</div>}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">読み込み中…</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {sets.map((s) => (
            <div key={s.id} className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${s.key === "sswField" ? "lg:col-span-2" : ""}`}>
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-ink">{s.label}</h2>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{s.key}</span>
                  <span className="ml-auto text-xs text-slate-400">{s.items.length} 件</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{s.hint}</p>
              </div>

              {s.key === "sswField" ? (
                <SswTreeEditor set={s} onChanged={reload} />
              ) : (
              <><div className="max-h-[360px] overflow-y-auto p-2">
                {s.items.map((item, idx) => (
                  <div key={item.id} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 ${item.enabled ? "" : "opacity-50"}`}>
                    <div className="flex flex-col">
                      <button onClick={() => move(item, "up")} disabled={idx === 0} className="text-slate-300 hover:text-bl-red disabled:opacity-30" aria-label="上へ"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 15 6-6 6 6" /></svg></button>
                      <button onClick={() => move(item, "down")} disabled={idx === s.items.length - 1} className="text-slate-300 hover:text-bl-red disabled:opacity-30" aria-label="下へ"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg></button>
                    </div>
                    <input
                      defaultValue={item.value}
                      onBlur={(e) => rename(s.id, item, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none hover:border-slate-200 focus:border-bl-red focus:bg-white"
                    />
                    <button onClick={() => toggle(s.id, item)} title={item.enabled ? "有効（クリックで無効）" : "無効（クリックで有効）"} className={`relative h-5 w-9 shrink-0 rounded-full transition ${item.enabled ? "bg-bl-red" : "bg-slate-300"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${item.enabled ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                    <button onClick={() => remove(s.id, item)} className="shrink-0 text-slate-300 hover:text-red-500" aria-label="削除"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></button>
                  </div>
                ))}
                {s.items.length === 0 && <div className="p-4 text-center text-xs text-slate-400">定義がありません。</div>}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 p-2.5">
                <input
                  value={adding[s.id] || ""}
                  onChange={(e) => setAdding((a) => ({ ...a, [s.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") addItem(s); }}
                  placeholder="新しい定義を追加…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-bl-red"
                />
                <button onClick={() => addItem(s)} className="btn btn-navy btn-sm">追加</button>
              </div>
              </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
