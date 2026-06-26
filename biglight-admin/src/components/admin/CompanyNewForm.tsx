"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CompanyNewForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", industry: "", address: "", contactName: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setErr("");
    if (!f.name.trim()) { setErr("企業名は必須です"); return; }
    setSaving(true);
    const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setSaving(false);
    if (res.ok) { router.push("/admin/jobs/new"); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error || "保存に失敗しました");
  }

  return (
    <div className="card max-w-2xl p-6">
      <div className="grid gap-x-6 sm:grid-cols-2">
        <div className="mb-4 sm:col-span-2"><label className="label">企業名 <span className="text-bl-red">*</span></label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="株式会社〇〇" /></div>
        <div className="mb-4"><label className="label">業種</label><input className="input" value={f.industry} onChange={(e) => set("industry", e.target.value)} placeholder="工業製品製造業 など" /></div>
        <div className="mb-4"><label className="label">担当者名</label><input className="input" value={f.contactName} onChange={(e) => set("contactName", e.target.value)} /></div>
        <div className="mb-4"><label className="label">電話番号</label><input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="mb-4"><label className="label">メール</label><input type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="mb-4 sm:col-span-2"><label className="label">住所</label><input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
      </div>
      {err && <p className="mb-3 text-sm font-semibold text-bl-red">{err}</p>}
      <div className="flex justify-end gap-2">
        <Link href="/admin" className="btn btn-ghost">キャンセル</Link>
        <button onClick={save} disabled={saving} className="btn btn-navy">{saving ? "保存中…" : "保存して求人作成へ"}</button>
      </div>
    </div>
  );
}
