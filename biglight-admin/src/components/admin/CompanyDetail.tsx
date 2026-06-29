"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, publicStatusTone } from "@/components/ui/Badge";
import { PUBLIC_STATUS_LABEL, JOB_OP_STATUS_LABEL, APP_STATUS_LABEL } from "@/lib/constants";

export type CompanyInfo = {
  id: string;
  name: string;
  industry: string | null;
  address: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  paymentInfo: string | null;
  contractDetail: string | null;
  contractDate: string | null; // YYYY-MM-DD
  notes: string | null;
};
export type CompanyJob = { id: string; code: string; title: string; opStatus: string; publicStatus: string };
export type CompanyApplicant = { id: string; candidateId: string; name: string; kana: string | null; jobTitle: string; jobCode: string; status: string; createdAt: string };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <div className="w-28 shrink-0 text-xs font-bold text-slate-500">{label}</div>
      <div className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-ink">{children || <span className="text-slate-300">未登録</span>}</div>
    </div>
  );
}

export function CompanyDetail({ company, jobs, applicants, canEdit }: { company: CompanyInfo; jobs: CompanyJob[]; applicants: CompanyApplicant[]; canEdit: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [f, setF] = useState(company);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof CompanyInfo, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setErr("");
    if (!f.name.trim()) { setErr("企業名は必須です"); return; }
    setSaving(true);
    const res = await fetch(`/api/companies/${company.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setSaving(false);
    if (res.ok) { setEditing(false); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error || "保存に失敗しました");
  }

  const openCnt = jobs.filter((j) => j.opStatus === "OPEN").length;

  return (
    <div className="space-y-4">
      {/* ===== thông tin công ty ===== */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black text-ink">企業情報</h2>
          {canEdit && !editing && (
            <button onClick={() => { setF(company); setEditing(true); }} className="btn btn-ghost btn-sm gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              編集
            </button>
          )}
        </div>

        {!editing ? (
          <div className="divide-y divide-slate-100">
            <Row label="企業名">{company.name}</Row>
            <Row label="業種">{company.industry}</Row>
            <Row label="住所">{company.address}</Row>
            <Row label="担当者">{company.contactName}</Row>
            <Row label="連絡先">{[company.phone, company.email].filter(Boolean).join(" / ")}</Row>
            <Row label="契約日">{company.contractDate}</Row>
            <Row label="契約内容">{company.contractDetail}</Row>
            <Row label="支払い情報">{company.paymentInfo}</Row>
            <Row label="備考">{company.notes}</Row>
          </div>
        ) : (
          <div className="grid gap-x-6 sm:grid-cols-2">
            <div className="mb-4 sm:col-span-2"><label className="label">企業名 <span className="text-bl-red">*</span></label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="mb-4"><label className="label">業種</label><input className="input" value={f.industry ?? ""} onChange={(e) => set("industry", e.target.value)} /></div>
            <div className="mb-4"><label className="label">担当者名</label><input className="input" value={f.contactName ?? ""} onChange={(e) => set("contactName", e.target.value)} /></div>
            <div className="mb-4"><label className="label">電話番号</label><input className="input" value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
            <div className="mb-4"><label className="label">メール</label><input type="email" className="input" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="mb-4 sm:col-span-2"><label className="label">住所</label><input className="input" value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} /></div>
            <div className="mb-4"><label className="label">契約日</label><input type="date" className="input" value={f.contractDate ?? ""} onChange={(e) => set("contractDate", e.target.value)} /></div>
            <div className="mb-4"><label className="label">支払い情報</label><input className="input" value={f.paymentInfo ?? ""} onChange={(e) => set("paymentInfo", e.target.value)} /></div>
            <div className="mb-4 sm:col-span-2"><label className="label">契約内容</label><textarea className="input min-h-[72px]" value={f.contractDetail ?? ""} onChange={(e) => set("contractDetail", e.target.value)} /></div>
            <div className="mb-4 sm:col-span-2"><label className="label">備考</label><textarea className="input min-h-[72px]" value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
            {err && <p className="mb-3 text-sm font-semibold text-bl-red sm:col-span-2">{err}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button onClick={() => { setEditing(false); setErr(""); }} className="btn btn-ghost">キャンセル</button>
              <button onClick={save} disabled={saving} className="btn btn-navy">{saving ? "保存中…" : "保存"}</button>
            </div>
          </div>
        )}
      </div>

      {/* ===== số liệu ===== */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center"><div className="text-2xl font-black text-ink">{jobs.length}</div><div className="text-[10px] font-bold text-slate-400">求人数</div></div>
        <div className="card p-4 text-center"><div className="text-2xl font-black text-bl-green">{openCnt}</div><div className="text-[10px] font-bold text-slate-400">募集中</div></div>
        <button onClick={() => setShowApplicants((v) => !v)} className="card p-4 text-center transition hover:bg-slate-50">
          <div className="text-2xl font-black text-bl-red">{applicants.length}</div>
          <div className="text-[10px] font-bold text-slate-400">応募者数（クリックで一覧）</div>
        </button>
      </div>

      {/* ===== danh sách ứng viên đã ứng tuyển ===== */}
      {showApplicants && (
        <div className="card p-5">
          <h2 className="mb-2 text-sm font-black text-ink">応募者一覧（{applicants.length}名）</h2>
          {applicants.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">この企業への応募はまだありません。</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {applicants.map((a) => (
                <Link key={a.id} href={`/admin/candidates/${a.candidateId}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:bg-slate-50">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{a.name}{a.kana && <span className="ml-1 text-xs font-normal text-slate-400">{a.kana}</span>}</span>
                  <span className="font-mono text-[11px] text-slate-400">{a.jobCode}</span>
                  <span className="min-w-0 max-w-[40%] truncate text-xs text-slate-500">{a.jobTitle}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{APP_STATUS_LABEL[a.status] ?? a.status}</span>
                  <span className="text-[10px] text-slate-400">{a.createdAt}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====求人 của công ty ===== */}
      <div className="card p-5">
        <h2 className="mb-2 text-sm font-black text-ink">求人（{jobs.length}件）</h2>
        {jobs.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">この企業の求人はまだありません。</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {jobs.map((j) => (
              <Link key={j.id} href={`/admin/jobs/${j.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50">
                <span className="font-mono text-[11px] font-bold text-slate-400">{j.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{j.title}</span>
                <span className="text-[10px] text-slate-400">{JOB_OP_STATUS_LABEL[j.opStatus] ?? j.opStatus}</span>
                <Badge tone={publicStatusTone(j.publicStatus) as never}>{PUBLIC_STATUS_LABEL[j.publicStatus] ?? j.publicStatus}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
