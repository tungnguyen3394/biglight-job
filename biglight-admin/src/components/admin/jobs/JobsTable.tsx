"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { JobStatusBadge, BoolBadge } from "./JobStatusBadge";
import { JOB_OP_STATUS_LABEL } from "@/lib/constants";
import { ColumnsIcon } from "@/components/admin/toolbar";
import { type JobRow, type SortKey, type SortDir } from "@/app/admin/jobs/types";

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><path d="M8 9l4-4 4 4M8 15l4 4 4-4" /></svg>;
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-bl-red">{dir === "asc" ? <path d="M6 14l6-6 6 6" /> : <path d="M6 10l6 6 6-6" />}</svg>;
}

const TH = "whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-slate-500";
const TD = "whitespace-nowrap px-4 py-3 align-middle text-slate-700";
const yen = (n: number | null) => (n != null ? "¥" + n.toLocaleString("ja-JP") : "—");
const txt = (s: string | null) => (s && s.trim() ? s : "—");
const join = (a: string[]) => (a.length ? a.join("・") : "—");

// Cột giữa (bật/tắt qua 表示項目). code/求人タイトル/操作 luôn hiển thị.
const COLUMNS: { key: string; label: string; sortKey?: SortKey; render: (j: JobRow) => React.ReactNode }[] = [
  { key: "company", label: "企業名", sortKey: "company", render: (j) => <span className="line-clamp-2 max-w-[180px]">{j.company ?? "—"}</span> },
  { key: "industry", label: "業種", render: (j) => txt(j.industry) },
  { key: "jobType", label: "職種", render: (j) => txt(j.jobType) },
  { key: "location", label: "勤務地", sortKey: "location", render: (j) => `${j.location}${j.city ? ` ${j.city}` : ""}` },
  { key: "recruit", label: "募集人数", sortKey: "recruitCount", render: (j) => <span><b className="text-ink">{j.recruitCount}名</b><span className="ml-1 text-xs text-slate-400">(男{j.recruitMale}/女{j.recruitFemale})</span></span> },
  { key: "status", label: "募集状況", render: (j) => (j.opStatus === "OPEN" ? (j.isUrgent ? <span className="font-bold text-bl-red">急募</span> : <span className="text-emerald-600">募集中</span>) : <span className="text-slate-400">{JOB_OP_STATUS_LABEL[j.opStatus] ?? j.opStatus}</span>) },
  { key: "payType", label: "給与種別", render: (j) => txt(j.payType) },
  { key: "baseSalary", label: "基本給", render: (j) => <span className="font-medium text-ink">{yen(j.baseSalary)}</span> },
  { key: "monthly", label: "月収例", sortKey: "salary", render: (j) => yen(j.expectedMonthly) },
  { key: "takehome", label: "手取り目安", render: (j) => yen(j.expectedTakeHome) },
  { key: "jp", label: "日本語", render: (j) => txt(j.japaneseLevel) },
  { key: "employmentType", label: "雇用期間", render: (j) => <span className="line-clamp-1 max-w-[180px]">{txt(j.employmentType)}</span> },
  { key: "dorm", label: "寮", render: (j) => <BoolBadge on={j.dormitory} label="寮" /> },
  { key: "dormFee", label: "寮費", render: (j) => (j.dormitoryFee != null ? `${yen(j.dormitoryFee)}/月` : "—") },
  { key: "utilities", label: "水道光熱", render: (j) => <span className="line-clamp-1 max-w-[140px]">{txt(j.utilitiesCost)}</span> },
  { key: "wifi", label: "ネット", render: (j) => txt(j.wifi) },
  { key: "workHours", label: "勤務時間", render: (j) => <span className="line-clamp-1 max-w-[180px]">{txt(j.workHours)}</span> },
  { key: "overtime", label: "残業", render: (j) => <span className="line-clamp-1 max-w-[140px]">{txt(j.overtimeHours)}</span> },
  { key: "holidays", label: "休日", render: (j) => <span className="line-clamp-1 max-w-[160px]">{txt(j.holidays)}</span> },
  { key: "bonus", label: "賞与・昇給", render: (j) => <span className="line-clamp-1 max-w-[160px]">{txt(j.bonus)}</span> },
  { key: "commute", label: "通勤", render: (j) => <span className="line-clamp-1 max-w-[140px]">{txt(j.commuteMethod)}</span> },
  { key: "benefits", label: "待遇・福利厚生", render: (j) => <span className="line-clamp-1 max-w-[200px]">{join(j.benefits)}</span> },
  { key: "qualification", label: "必要な資格", render: (j) => <span className="line-clamp-1 max-w-[180px]">{txt(j.requiredQualification)}</span> },
  { key: "start", label: "入社時期", render: (j) => txt(j.startTime) },
  { key: "houseType", label: "住居タイプ", render: (j) => txt(j.houseType) },
  { key: "tags", label: "タグ", render: (j) => <span className="line-clamp-1 max-w-[200px]">{join(j.tags)}</span> },
  { key: "public", label: "公開", render: (j) => <JobStatusBadge status={j.publicStatus} /> },
  { key: "staff", label: "担当者", render: (j) => <span className="text-xs">{j.staff ?? "—"}</span> },
  { key: "updated", label: "更新日", sortKey: "updatedAt", render: (j) => <span className="text-xs text-slate-400">{new Date(j.updatedAt).toLocaleDateString("ja-JP")}</span> },
];
const ALL_KEYS = COLUMNS.map((c) => c.key);
const DEFAULT_VISIBLE = ["company", "jobType", "location", "recruit", "status", "monthly", "jp", "dorm", "public", "staff", "updated"];

export function JobsTable({
  rows, sort, onSort, canEdit, canDelete, onDelete, onDuplicate, busyId,
}: {
  rows: JobRow[];
  sort: { key: SortKey; dir: SortDir };
  onSort: (k: SortKey) => void;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  busyId: string | null;
}) {
  const [visible, setVisible] = useState<Set<string>>(() => new Set(DEFAULT_VISIBLE));
  const [menu, setMenu] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem("bl_jobs_admin_cols") || "null"); if (Array.isArray(s)) setVisible(new Set(s.filter((k) => ALL_KEYS.includes(k)))); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("bl_jobs_admin_cols", JSON.stringify([...visible])); }, [visible, ready]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const cols = COLUMNS.filter((c) => visible.has(c.key));

  const HeadCell = ({ label, sortKey, extra = "" }: { label: string; sortKey?: SortKey; extra?: string }) =>
    sortKey ? (
      <th className={`${TH} ${extra} cursor-pointer select-none hover:text-ink`} onClick={() => onSort(sortKey)}>
        <span className="inline-flex items-center gap-1">{label}<SortArrow active={sort.key === sortKey} dir={sort.dir} /></span>
      </th>
    ) : <th className={`${TH} ${extra}`}>{label}</th>;

  return (
    <div className="hidden lg:block">
      {/* 表示項目 */}
      <div className="mb-2 flex items-center justify-end">
        <div ref={ref} className="relative">
          <button onClick={() => setMenu((m) => !m)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-bl-red">
            <ColumnsIcon />
            表示項目（{cols.length}）
          </button>
          {menu && (
            <div className="absolute right-0 z-50 mt-2 w-60 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex gap-2">
                <button onClick={() => setVisible(new Set(ALL_KEYS))} className="flex-1 rounded-lg bg-slate-100 py-1 text-xs font-bold text-slate-700">すべて選択</button>
                <button onClick={() => setVisible(new Set())} className="flex-1 rounded-lg bg-slate-100 py-1 text-xs font-bold text-slate-700">クリア</button>
              </div>
              <div className="max-h-72 space-y-0.5 overflow-y-auto">
                {COLUMNS.map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={visible.has(c.key)} onChange={(e) => setVisible((s) => { const n = new Set(s); if (e.target.checked) n.add(c.key); else n.delete(c.key); return n; })} className="h-4 w-4 accent-bl-red" />
                    {c.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 px-1 text-[10px] text-slate-400">求人ID・タイトル・操作は常に表示されます。</p>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ maxHeight: "calc(100vh - 250px)" }}>
        <table className="border-collapse text-[13px]" style={{ minWidth: "max-content" }}>
          <thead>
            <tr className="border-b border-slate-200">
              <HeadCell label="求人ID" sortKey="code" extra="sticky left-0 top-0 z-30 bg-slate-50 border-r border-slate-200" />
              <HeadCell label="求人タイトル" sortKey="title" extra="sticky top-0 z-20 bg-slate-50 min-w-[220px]" />
              {cols.map((c) => <HeadCell key={c.key} label={c.label} sortKey={c.sortKey} extra="sticky top-0 z-20 bg-slate-50" />)}
              <th className={`${TH} sticky right-0 top-0 z-30 bg-slate-50 border-l border-slate-200 text-center`}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.id} className="border-b border-slate-100 bg-white even:bg-slate-50 hover:bg-bl-redsoft">
                <td className={`${TD} sticky left-0 z-10 bg-inherit border-r border-slate-200 font-mono text-xs font-bold text-slate-500`}>{j.code}</td>
                <td className="px-4 py-3 align-middle"><Link href={`/admin/jobs/${j.id}`} className="line-clamp-2 max-w-[260px] font-semibold text-ink hover:text-bl-red">{j.title}</Link></td>
                {cols.map((c) => <td key={c.key} className={TD}>{c.render(j)}</td>)}
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
            {rows.length === 0 && <tr><td colSpan={cols.length + 3} className="px-4 py-12 text-center text-slate-400">該当する求人がありません</td></tr>}
          </tbody>
        </table>
      </div>
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
