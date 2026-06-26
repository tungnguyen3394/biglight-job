"use client";

import Link from "next/link";
import { JobStatusBadge, BoolBadge } from "./JobStatusBadge";
import { JOB_OP_STATUS_LABEL } from "@/lib/constants";
import { formatSalary, type JobRow, type SortKey, type SortDir } from "@/app/admin/jobs/types";

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><path d="M8 9l4-4 4 4M8 15l4 4 4-4" /></svg>;
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-bl-red">{dir === "asc" ? <path d="M6 14l6-6 6 6" /> : <path d="M6 10l6 6 6-6" />}</svg>;
}

const TH = "whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-slate-500";
const TD = "whitespace-nowrap px-4 py-3 align-middle";

export function JobsTable({
  rows, sort, onSort, seeCommission, canEdit, canDelete, onDelete, onDuplicate, busyId,
}: {
  rows: JobRow[];
  sort: { key: SortKey; dir: SortDir };
  onSort: (k: SortKey) => void;
  seeCommission: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  busyId: string | null;
}) {
  const SortTH = ({ label, k, extra = "" }: { label: string; k: SortKey; extra?: string }) => (
    <th className={`${TH} ${extra} cursor-pointer select-none hover:text-ink`} onClick={() => onSort(k)}>
      <span className="inline-flex items-center gap-1">{label}<SortArrow active={sort.key === k} dir={sort.dir} /></span>
    </th>
  );

  return (
    <div className="hidden overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:block" style={{ maxHeight: "calc(100vh - 250px)" }}>
      <table className="w-full min-w-[1550px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-slate-200">
            <SortTH label="求人ID" k="code" extra="sticky left-0 top-0 z-30 bg-slate-50 border-r border-slate-200" />
            <SortTH label="求人タイトル" k="title" extra="sticky top-0 z-20 bg-slate-50 min-w-[220px]" />
            <SortTH label="企業名" k="company" extra="sticky top-0 z-20 bg-slate-50 min-w-[160px]" />
            <th className={`${TH} sticky top-0 z-20 bg-slate-50`}>職種</th>
            <SortTH label="勤務地" k="location" extra="sticky top-0 z-20 bg-slate-50" />
            <SortTH label="募集人数" k="recruitCount" extra="sticky top-0 z-20 bg-slate-50" />
            <SortTH label="給与" k="salary" extra="sticky top-0 z-20 bg-slate-50" />
            <th className={`${TH} sticky top-0 z-20 bg-slate-50`}>寮</th>
            <th className={`${TH} sticky top-0 z-20 bg-slate-50`}>夜勤</th>
            <th className={`${TH} sticky top-0 z-20 bg-slate-50`}>シフト</th>
            <th className={`${TH} sticky top-0 z-20 bg-slate-50`}>公開</th>
            <th className={`${TH} sticky top-0 z-20 bg-slate-50`}>担当者</th>
            {seeCommission && <th className={`${TH} sticky top-0 z-20 bg-slate-50`}>紹介報酬</th>}
            <SortTH label="更新日" k="updatedAt" extra="sticky top-0 z-20 bg-slate-50" />
            <th className={`${TH} sticky right-0 top-0 z-30 bg-slate-50 border-l border-slate-200 text-center`}>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((j) => (
            <tr key={j.id} className="border-b border-slate-100 bg-white even:bg-slate-50 hover:bg-bl-redsoft">
              <td className={`${TD} sticky left-0 z-10 bg-inherit border-r border-slate-200 font-mono text-xs font-bold text-slate-500`}>{j.code}</td>
              <td className="px-4 py-3 align-middle">
                <Link href={`/admin/jobs/${j.id}`} className="line-clamp-2 max-w-[260px] font-semibold text-ink hover:text-bl-red">{j.title}</Link>
              </td>
              <td className="px-4 py-3 align-middle"><span className="line-clamp-2 max-w-[180px] text-slate-700">{j.company ?? "—"}</span></td>
              <td className={`${TD} text-slate-700`}>{j.jobType ?? "—"}</td>
              <td className={`${TD} text-slate-700`}>{j.location}{j.city ? ` ${j.city}` : ""}</td>
              <td className={TD}>
                <span className="font-semibold text-ink">{j.recruitCount}名</span>
                <span className="ml-1 text-xs text-slate-400">(男{j.recruitMale}/女{j.recruitFemale})</span>
              </td>
              <td className={`${TD} font-medium text-ink`}>{formatSalary(j.salaryMin, j.salaryMax)}</td>
              <td className={TD}><BoolBadge on={j.dormitory} label="寮" /></td>
              <td className={TD}><BoolBadge on={j.nightShift} label="夜勤" /></td>
              <td className={TD}><BoolBadge on={j.shiftWork} label="シフト" /></td>
              <td className={TD}>
                <JobStatusBadge status={j.publicStatus} />
                <div className="mt-0.5 text-[10px] text-slate-400">{JOB_OP_STATUS_LABEL[j.opStatus] ?? j.opStatus}</div>
              </td>
              <td className={`${TD} text-xs text-slate-600`}>{j.staff ?? "—"}</td>
              {seeCommission && <td className={`${TD} font-semibold text-navy`}>{j.commission != null ? "¥" + j.commission.toLocaleString("ja-JP") : "—"}</td>}
              <td className={`${TD} text-xs text-slate-400`}>{new Date(j.updatedAt).toLocaleDateString("ja-JP")}</td>
              <td className="sticky right-0 z-10 bg-inherit border-l border-slate-200 px-2 py-3">
                <div className="flex items-center justify-center gap-1">
                  <IconBtn title="詳細" href={`/jobs/${j.id}`} newTab icon={<><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></>} />
                  {canEdit && <IconBtn title="編集" href={`/admin/jobs/${j.id}`} icon={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>} />}
                  {canEdit && <IconBtn title="複製" onClick={() => onDuplicate(j.id)} busy={busyId === j.id} icon={<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>} />}
                  {canDelete && <IconBtn title="削除" onClick={() => onDelete(j.id)} danger icon={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>} />}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={seeCommission ? 15 : 14} className="px-4 py-12 text-center text-slate-400">該当する求人がありません</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function IconBtn({ title, href, newTab, onClick, danger, busy, icon }: { title: string; href?: string; newTab?: boolean; onClick?: () => void; danger?: boolean; busy?: boolean; icon: React.ReactNode }) {
  const cls = `flex h-7 w-7 items-center justify-center rounded-md transition ${danger ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-slate-100 hover:text-navy"}`;
  const svg = busy
    ? <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>;
  if (href) return <Link href={href} title={title} aria-label={title} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} className={cls}>{svg}</Link>;
  return <button title={title} aria-label={title} onClick={onClick} disabled={busy} className={cls}>{svg}</button>;
}
