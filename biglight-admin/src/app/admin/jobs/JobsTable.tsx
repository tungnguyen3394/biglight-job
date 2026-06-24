"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { Badge, publicStatusTone } from "@/components/ui/Badge";
import {
  PUBLIC_STATUS_LABEL,
  JOB_OP_STATUS_LABEL,
} from "@/lib/constants";

interface JobRow {
  id: string;
  code: string;
  title: string;
  jobTypeName: string | null;
  location: string;
  city: string | null;
  recruitCount: number;
  recruitMale: number;
  recruitFemale: number;
  salaryMin: number | null;
  salaryMax: number | null;
  dormitoryAvailable: boolean;
  nightShift: boolean;
  shiftWork: boolean;
  status: string;
  publicStatus: string;
  industry: string;
  updatedAt: string;
  company: { name: string } | null;
  biglightStaff: { name: string } | null;
  ctv: { id: string; name: string } | null;
  jobCommissions?: { amount: number }[];
}

export function JobsTable({
  jobs,
  seeCommission,
  canDelete,
  canEdit,
}: {
  jobs: JobRow[];
  role: Role;
  seeCommission: boolean;
  canDelete: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [fPublic, setFPublic] = useState("");
  const [fDorm, setFDorm] = useState("");
  const [fNight, setFNight] = useState("");
  const [fIndustry, setFIndustry] = useState("");
  const [delId, setDelId] = useState<string | null>(null);

  const industries = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.industry))).filter(Boolean),
    [jobs]
  );

  const rows = jobs.filter((j) => {
    if (fPublic && j.publicStatus !== fPublic) return false;
    if (fDorm === "1" && !j.dormitoryAvailable) return false;
    if (fDorm === "0" && j.dormitoryAvailable) return false;
    if (fNight === "1" && !j.nightShift) return false;
    if (fIndustry && j.industry !== fIndustry) return false;
    if (q) {
      const t = `${j.code}${j.title}${j.company?.name}${j.location}${j.city}${j.jobTypeName}`.toLowerCase();
      if (!t.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const yen = (j: JobRow) =>
    j.salaryMin || j.salaryMax
      ? `¥${(j.salaryMin ?? 0).toLocaleString()}〜${(j.salaryMax ?? 0).toLocaleString()}`
      : "—";

  async function doDelete() {
    if (!delId) return;
    await fetch(`/api/jobs/${delId}`, { method: "DELETE" });
    setDelId(null);
    router.refresh();
  }

  return (
    <div className="card">
      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <input
          className="input max-w-xs"
          placeholder="検索（ID・タイトル・企業・勤務地）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-auto" value={fIndustry} onChange={(e) => setFIndustry(e.target.value)}>
          <option value="">業種：すべて</option>
          {industries.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
        <select className="input w-auto" value={fPublic} onChange={(e) => setFPublic(e.target.value)}>
          <option value="">公開：すべて</option>
          {Object.entries(PUBLIC_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input w-auto" value={fDorm} onChange={(e) => setFDorm(e.target.value)}>
          <option value="">寮：すべて</option>
          <option value="1">寮あり</option>
          <option value="0">寮なし</option>
        </select>
        <select className="input w-auto" value={fNight} onChange={(e) => setFNight(e.target.value)}>
          <option value="">夜勤：すべて</option>
          <option value="1">夜勤あり</option>
        </select>
        <span className="ml-auto text-sm text-slate-500">{rows.length} 件</span>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="p-3">求人ID</th>
              <th className="p-3">求人タイトル</th>
              <th className="p-3">企業名</th>
              <th className="p-3">職種</th>
              <th className="p-3">勤務地</th>
              <th className="p-3">募集人数</th>
              <th className="p-3">給与</th>
              <th className="p-3">寮</th>
              <th className="p-3">夜勤</th>
              <th className="p-3">シフト</th>
              <th className="p-3">公開</th>
              <th className="p-3">担当者</th>
              {seeCommission && <th className="p-3">紹介報酬</th>}
              <th className="p-3">更新日</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-3 font-mono text-xs font-bold text-slate-500">{j.code}</td>
                <td className="p-3 font-semibold">{j.title}</td>
                <td className="p-3">{j.company?.name ?? "—"}</td>
                <td className="p-3">{j.jobTypeName ?? "—"}</td>
                <td className="p-3">{j.location}{j.city ? ` ${j.city}` : ""}</td>
                <td className="p-3">
                  {j.recruitCount}名
                  <span className="ml-1 text-xs text-slate-400">
                    (男{j.recruitMale}/女{j.recruitFemale})
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">{yen(j)}</td>
                <td className="p-3">{j.dormitoryAvailable ? "○" : "—"}</td>
                <td className="p-3">{j.nightShift ? "○" : "—"}</td>
                <td className="p-3">{j.shiftWork ? "○" : "—"}</td>
                <td className="p-3">
                  <Badge tone={publicStatusTone(j.publicStatus) as never}>
                    {PUBLIC_STATUS_LABEL[j.publicStatus]}
                  </Badge>
                  <div className="mt-1 text-[10px] text-slate-400">{JOB_OP_STATUS_LABEL[j.status]}</div>
                </td>
                <td className="p-3 text-xs">{j.biglightStaff?.name ?? "—"}</td>
                {seeCommission && (
                  <td className="p-3 whitespace-nowrap font-semibold text-navy">
                    {j.jobCommissions && j.jobCommissions.length
                      ? "¥" + j.jobCommissions.reduce((s, c) => s + c.amount, 0).toLocaleString()
                      : "—"}
                  </td>
                )}
                <td className="p-3 text-xs text-slate-400">
                  {new Date(j.updatedAt).toLocaleDateString("ja-JP")}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/jobs/${j.id}`} className="text-xs font-semibold text-brand-blue hover:underline">
                      {canEdit ? "編集" : "詳細"}
                    </Link>
                    {canDelete && (
                      <button onClick={() => setDelId(j.id)} className="text-xs font-semibold text-red-500 hover:underline">
                        削除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={16} className="p-10 text-center text-slate-400">
                  該当する求人がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* delete confirm modal */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDelId(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold">求人を削除しますか？</h3>
            <p className="mt-1 text-sm text-slate-500">この操作は取り消せません。</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setDelId(null)}>キャンセル</button>
              <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={doDelete}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
