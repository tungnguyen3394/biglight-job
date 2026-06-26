"use client";

import Link from "next/link";
import { ExportButtons } from "./ExportButtons";
import type { JobRow } from "@/app/admin/jobs/types";

export function JobsToolbar({
  search, onSearch, filterCount, panelOpen, onTogglePanel, canCreate, rows, seeCommission,
}: {
  search: string;
  onSearch: (v: string) => void;
  filterCount: number;
  panelOpen: boolean;
  onTogglePanel: () => void;
  canCreate: boolean;
  rows: JobRow[];
  seeCommission: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* search — trái */}
      <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input className="input pl-9" placeholder="検索（ID・タイトル・企業・勤務地）" value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>

      {/* actions — phải */}
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <button onClick={onTogglePanel} className={`btn gap-1.5 px-3 py-2 ${panelOpen ? "btn-navy" : "btn-ghost"}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
          フィルター{filterCount > 0 && <span className={`rounded-full px-1.5 text-[10px] font-bold ${panelOpen ? "bg-white/25" : "bg-bl-red text-white"}`}>{filterCount}</span>}
        </button>

        <ExportButtons rows={rows} seeCommission={seeCommission} />

        {canCreate && (
          <Link href="/admin/jobs/new" className="btn btn-navy gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            新規求人
          </Link>
        )}
      </div>
    </div>
  );
}
