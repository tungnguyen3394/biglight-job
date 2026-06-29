"use client";

import Link from "next/link";
import { ExportButtons } from "./ExportButtons";
import { FilterIcon, SearchIcon, PlusIcon } from "@/components/admin/toolbar";
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
        <SearchIcon />
        <input className="input pl-9" placeholder="検索（ID・タイトル・企業・勤務地）" value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>

      {/* actions — phải */}
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <button onClick={onTogglePanel} className={`btn gap-1.5 px-3 py-2 ${panelOpen ? "btn-navy" : "btn-ghost"}`}>
          <FilterIcon />
          絞り込み{filterCount > 0 && <span className={`rounded-full px-1.5 text-[10px] font-bold ${panelOpen ? "bg-white/25" : "bg-bl-red text-white"}`}>{filterCount}</span>}
        </button>

        <ExportButtons rows={rows} seeCommission={seeCommission} />

        {canCreate && (
          <Link href="/admin/jobs/new" className="btn btn-navy gap-1.5">
            <PlusIcon />
            新規求人
          </Link>
        )}
      </div>
    </div>
  );
}
