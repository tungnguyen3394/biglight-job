"use client";

import { useEffect, useState } from "react";
import { GUIDE_CATEGORY_DEFAULTS } from "@/lib/options";

type Item = { id: string; value: string };

// カテゴリ động cho 記事作成: dropdown + thêm/xóa inline (lưu master-data, dùng chung với trang user).
export function CategoryField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [setId, setSetId] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [managing, setManaging] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/options");
        if (!r.ok) return;
        const j = await r.json();
        const set = (j.sets || []).find((s: { key: string }) => s.key === "guideCategory");
        if (set) { setSetId(set.id); setItems(set.items.map((i: { id: string; value: string }) => ({ id: i.id, value: i.value }))); }
      } catch { /* fallback dùng GUIDE_CATEGORY_DEFAULTS */ }
    })();
  }, []);

  const cats = items.length ? items.map((i) => i.value) : GUIDE_CATEGORY_DEFAULTS;

  async function add() {
    const v = draft.trim();
    if (!v || !setId || busy || cats.includes(v)) { setDraft(""); return; }
    setBusy(true);
    const r = await fetch("/api/admin/options/item", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setId, value: v }) });
    setBusy(false);
    if (r.ok) { const j = await r.json(); setItems((p) => [...p, { id: j.item.id, value: j.item.value }]); setDraft(""); onChange(j.item.value); }
    else alert((await r.json().catch(() => ({}))).error || "カテゴリの追加に失敗しました（設定の権限が必要です）");
  }
  async function del(it: Item) {
    if (busy || !window.confirm(`カテゴリ「${it.value}」を削除しますか？`)) return;
    setBusy(true);
    const r = await fetch(`/api/admin/options/item/${it.id}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) { setItems((p) => p.filter((x) => x.id !== it.id)); if (value === it.value) onChange(""); }
    else alert((await r.json().catch(() => ({}))).error || "削除に失敗しました（設定の権限が必要です）");
  }

  return (
    <div>
      <div className="a-row">
        <select className="a-sel" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">（未分類）</option>
          {!cats.includes(value) && value && <option value={value}>{value}（旧）</option>}
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button type="button" className="a-btn" title="カテゴリを管理" onClick={() => setManaging((m) => !m)}>{managing ? "閉じる" : "管理"}</button>
      </div>

      {managing && (
        <div style={{ marginTop: 8, padding: 10, border: "1px solid var(--line, #e5e7eb)", borderRadius: 10, background: "var(--soft, #f8fafc)" }}>
          <div className="a-row">
            <input className="a-inp" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="新しいカテゴリ名を入力" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
            <button type="button" className="a-btn" onClick={add} disabled={busy || !draft.trim() || !setId}>追加</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {items.length === 0 && <span style={{ fontSize: 12, color: "var(--faint, #9ca3af)" }}>既定のカテゴリを使用中。追加すると保存されます。</span>}
            {items.map((it) => (
              <span key={it.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 6px 3px 10px", borderRadius: 999, background: "#fff", border: "1px solid var(--line, #e5e7eb)", fontSize: 13 }}>
                {it.value}
                <button type="button" onClick={() => del(it)} title="削除" disabled={busy} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 999, border: "none", background: "#FDECEC", color: "#D02E26", cursor: "pointer", lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
