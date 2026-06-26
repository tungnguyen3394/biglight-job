"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NATIONALITIES, VISA_TYPES, JP_LEVELS } from "@/lib/candidateFields";

export function CandidateNewForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", kana: "", nationality: "", gender: "ANY", phone: "", email: "", visaType: "", japaneseLevel: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setErr("");
    if (!f.name.trim()) { setErr("氏名は必須です"); return; }
    setSaving(true);
    const res = await fetch("/api/candidates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setSaving(false);
    if (res.ok) { const d = await res.json(); router.push(`/admin/candidates/${d.id}`); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error || "保存に失敗しました");
  }

  return (
    <div className="card max-w-2xl p-6">
      <div className="grid gap-x-6 sm:grid-cols-2">
        <div className="mb-4"><label className="label">氏名 <span className="text-bl-red">*</span></label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="NGUYEN VAN A" /></div>
        <div className="mb-4"><label className="label">フリガナ</label><input className="input" value={f.kana} onChange={(e) => set("kana", e.target.value)} placeholder="グエン ヴァン A" /></div>
        <div className="mb-4"><label className="label">性別</label><select className="input" value={f.gender} onChange={(e) => set("gender", e.target.value)}><option value="ANY">未選択</option><option value="MALE">男性</option><option value="FEMALE">女性</option></select></div>
        <div className="mb-4"><label className="label">国籍</label><select className="input" value={f.nationality} onChange={(e) => set("nationality", e.target.value)}><option value="">未選択</option>{NATIONALITIES.map((n) => <option key={n}>{n}</option>)}</select></div>
        <div className="mb-4"><label className="label">電話番号</label><input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="090-1234-5678" /></div>
        <div className="mb-4"><label className="label">メール</label><input type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="mb-4"><label className="label">現在の在留資格</label><select className="input" value={f.visaType} onChange={(e) => set("visaType", e.target.value)}><option value="">未選択</option>{VISA_TYPES.map((v) => <option key={v}>{v}</option>)}</select></div>
        <div className="mb-4"><label className="label">日本語レベル</label><select className="input" value={f.japaneseLevel} onChange={(e) => set("japaneseLevel", e.target.value)}><option value="">未選択</option>{JP_LEVELS.map((j) => <option key={j}>{j}</option>)}</select></div>
      </div>
      {err && <p className="mb-3 text-sm font-semibold text-bl-red">{err}</p>}
      <div className="flex justify-end gap-2">
        <Link href="/admin/candidates" className="btn btn-ghost">キャンセル</Link>
        <button onClick={save} disabled={saving} className="btn btn-navy">{saving ? "保存中…" : "保存する"}</button>
      </div>
    </div>
  );
}
