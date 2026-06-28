"use client";

import { useState } from "react";

export type TreeItem = { id: string; value: string; enabled: boolean; sortOrder: number; parentId: string | null };
type OptSet = { id: string; key: string; label: string; hint: string; items: TreeItem[] };

// Trình quản lý master-data 3 tầng: 業種 → 業務区分 → 従事する主な業務.
export function SswTreeEditor({ set, onChanged }: { set: OptSet; onChanged: () => void }) {
  const [add, setAdd] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const childrenOf = (pid: string | null) => set.items.filter((i) => (i.parentId ?? null) === pid).sort((a, b) => a.sortOrder - b.sortOrder);

  async function addItem(parentId: string | null, slot: string) {
    const value = (add[slot] || "").trim();
    if (!value || busy) return;
    setBusy(true);
    const r = await fetch("/api/admin/options/item", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setId: set.id, value, parentId }) });
    setBusy(false);
    if (r.ok) { setAdd((a) => ({ ...a, [slot]: "" })); onChanged(); }
    else alert((await r.json().catch(() => ({}))).error || "追加に失敗しました");
  }
  async function rename(item: TreeItem, value: string) {
    if (!value.trim() || value.trim() === item.value) return;
    await fetch(`/api/admin/options/item/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
    onChanged();
  }
  async function remove(item: TreeItem, lvl: string) {
    if (!window.confirm(`「${item.value}」(${lvl})を削除しますか？配下の項目もすべて削除されます。`)) return;
    await fetch(`/api/admin/options/item/${item.id}`, { method: "DELETE" });
    onChanged();
  }

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const NodeInput = ({ item, lvl }: { item: TreeItem; lvl: string }) => (
    <div className="flex flex-1 items-center gap-1.5" onClick={stop} onMouseDown={stop}>
      <input defaultValue={item.value} onBlur={(e) => rename(item, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold outline-none hover:border-slate-200 focus:border-bl-red focus:bg-white" />
      <button onClick={() => remove(item, lvl)} className="shrink-0 text-slate-300 hover:text-red-500" aria-label="削除"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></button>
    </div>
  );
  const AddRow = ({ slot, parentId, placeholder }: { slot: string; parentId: string | null; placeholder: string }) => (
    <div className="flex items-center gap-2 px-1 py-1">
      <input value={add[slot] || ""} onChange={(e) => setAdd((a) => ({ ...a, [slot]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") addItem(parentId, slot); }}
        placeholder={placeholder} className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-bl-red" />
      <button onClick={() => addItem(parentId, slot)} disabled={busy} className="btn btn-navy btn-sm">追加</button>
    </div>
  );
  const chevron = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 text-slate-400 transition group-open:rotate-90"><path d="m9 6 6 6-6 6" /></svg>;

  return (
    <div className="max-h-[520px] space-y-2 overflow-y-auto p-2">
      {childrenOf(null).map((field) => (
        <details key={field.id} className="group rounded-xl border border-slate-200 open:bg-slate-50/40">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-2 [&::-webkit-details-marker]:hidden">
            {chevron}<span className="text-[10px] font-bold text-bl-red">業種</span><NodeInput item={field} lvl="業種" />
          </summary>
          <div className="space-y-1.5 border-t border-slate-100 p-2 pl-5">
            {childrenOf(field.id).map((cat) => (
              <details key={cat.id} className="group rounded-lg border border-slate-100 bg-white">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 [&::-webkit-details-marker]:hidden">
                  {chevron}<span className="text-[10px] font-bold text-slate-500">業務区分</span><NodeInput item={cat} lvl="業務区分" />
                </summary>
                <div className="space-y-1 border-t border-slate-50 p-2 pl-5">
                  {childrenOf(cat.id).map((task) => (
                    <div key={task.id} className="flex items-center gap-1.5 rounded-lg px-1 hover:bg-slate-50"><span className="text-[10px] text-slate-400">業務</span><NodeInput item={task} lvl="業務" /></div>
                  ))}
                  <AddRow slot={`task-${cat.id}`} parentId={cat.id} placeholder="従事する主な業務を追加…" />
                </div>
              </details>
            ))}
            <AddRow slot={`cat-${field.id}`} parentId={field.id} placeholder="業務区分を追加…" />
          </div>
        </details>
      ))}
      <AddRow slot="root" parentId={null} placeholder="業種を追加…" />
    </div>
  );
}
