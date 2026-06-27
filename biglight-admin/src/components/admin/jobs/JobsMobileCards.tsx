"use client";

import Link from "next/link";
import { JobStatusBadge, BoolBadge } from "./JobStatusBadge";
import { formatSalary, type JobRow } from "@/app/admin/jobs/types";

export function JobsMobileCards({
  rows, canEdit, canDelete, onDelete, onDuplicate, busyId,
}: {
  rows: JobRow[];
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  busyId: string | null;
}) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 lg:hidden">該当する求人がありません</div>;
  }
  return (
    <div className="space-y-3 lg:hidden">
      {rows.map((j) => (
        <div key={j.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[11px] font-bold text-slate-400">{j.code}</span>
            <div className="flex items-center gap-1.5">
              {j.opStatus === "OPEN"
                ? (j.isUrgent
                  ? <span className="rounded-full bg-bl-redsoft px-2 py-0.5 text-[10px] font-bold text-bl-red">急募</span>
                  : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">募集中</span>)
                : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">終了</span>}
              <JobStatusBadge status={j.publicStatus} />
            </div>
          </div>
          <Link href={`/admin/jobs/${j.id}`} className="mt-1 block line-clamp-2 text-[15px] font-bold text-ink">{j.title}</Link>
          <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{j.company ?? "—"}</div>

          <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
            <div className="text-slate-400">業種</div><div className="font-medium text-slate-700">{j.industry}</div>
            <div className="text-slate-400">勤務地</div><div className="font-medium text-slate-700">{j.location}{j.city ? ` ${j.city}` : ""}</div>
            <div className="text-slate-400">職種</div><div className="font-medium text-slate-700">{j.jobType ?? "—"}</div>
            <div className="text-slate-400">募集人数</div><div className="font-medium text-slate-700">{j.recruitCount}名（男{j.recruitMale}/女{j.recruitFemale}）</div>
            <div className="text-slate-400">給与</div><div className="font-semibold text-ink">{formatSalary(j.salaryMin, j.salaryMax)}</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <BoolBadge on={j.dormitory} label="寮" />
            <BoolBadge on={j.nightShift} label="夜勤" />
            <BoolBadge on={j.shiftWork} label="シフト" />
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
            <Link href={`/jobs/${j.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost flex-1 py-2 text-xs">詳細</Link>
            {canEdit && <Link href={`/admin/jobs/${j.id}`} className="btn btn-navy flex-1 py-2 text-xs">編集</Link>}
            {canEdit && <button onClick={() => onDuplicate(j.id)} disabled={busyId === j.id} title="複製" className="btn btn-ghost px-3 py-2 disabled:opacity-50"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg></button>}
            {canDelete && <button onClick={() => onDelete(j.id)} title="削除" className="btn btn-ghost px-3 py-2 text-red-600"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg></button>}
          </div>
        </div>
      ))}
    </div>
  );
}
