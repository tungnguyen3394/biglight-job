"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JobsToolbar } from "@/components/admin/jobs/JobsToolbar";
import { JobsFilterPanel } from "@/components/admin/jobs/JobsFilterPanel";
import { JobsTable } from "@/components/admin/jobs/JobsTable";
import { JobsMobileCards } from "@/components/admin/jobs/JobsMobileCards";
import { EMPTY_FILTERS, activeFilterCount, salaryValue, type JobRow, type Filters, type SortKey, type SortDir } from "./types";

const uniq = (a: (string | null)[]) => Array.from(new Set(a.filter((x): x is string => !!x))).sort();

export function JobsManager({
  rows, seeCommission, canCreate, canEdit, canDelete,
}: {
  rows: JobRow[];
  seeCommission: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "updatedAt", dir: "desc" });
  const [delId, setDelId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const options = useMemo(() => ({
    industries: uniq(rows.map((r) => r.industry)),
    locations: uniq(rows.map((r) => r.location)),
    staffs: uniq(rows.map((r) => r.staff)),
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (filters.industry && r.industry !== filters.industry) return false;
      if (filters.publicStatus && r.publicStatus !== filters.publicStatus) return false;
      if (filters.dorm === "1" && !r.dormitory) return false;
      if (filters.dorm === "0" && r.dormitory) return false;
      if (filters.night === "1" && !r.nightShift) return false;
      if (filters.night === "0" && r.nightShift) return false;
      if (filters.location && r.location !== filters.location) return false;
      if (filters.staff && r.staff !== filters.staff) return false;
      if (filters.dateFrom && r.updatedAt.slice(0, 10) < filters.dateFrom) return false;
      if (filters.dateTo && r.updatedAt.slice(0, 10) > filters.dateTo) return false;
      if (q) {
        const t = `${r.code}${r.title}${r.company ?? ""}${r.location}${r.city ?? ""}${r.jobType ?? ""}`.toLowerCase();
        if (!t.includes(q)) return false;
      }
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      let av: string | number, bv: string | number;
      switch (sort.key) {
        case "code": av = a.code; bv = b.code; break;
        case "title": av = a.title; bv = b.title; break;
        case "company": av = a.company ?? ""; bv = b.company ?? ""; break;
        case "location": av = `${a.location}${a.city ?? ""}`; bv = `${b.location}${b.city ?? ""}`; break;
        case "recruitCount": av = a.recruitCount; bv = b.recruitCount; break;
        case "salary": av = salaryValue(a); bv = salaryValue(b); break;
        default: av = a.updatedAt; bv = b.updatedAt;
      }
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "ja") * dir;
    });
    return out;
  }, [rows, search, filters, sort]);

  function onSort(k: SortKey) {
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }));
  }
  async function doDelete() {
    if (!delId) return;
    await fetch(`/api/jobs/${delId}`, { method: "DELETE" });
    setDelId(null);
    router.refresh();
  }
  async function doDuplicate(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/jobs/${id}/duplicate`, { method: "POST" });
    setBusyId(null);
    if (res.ok) { const d = await res.json().catch(() => ({})); if (d.id) router.push(`/admin/jobs/${d.id}`); else router.refresh(); }
    else alert((await res.json().catch(() => ({}))).error || "複製に失敗しました");
  }

  return (
    <div className="space-y-4">
      <JobsToolbar
        search={search} onSearch={setSearch}
        filterCount={activeFilterCount(filters)}
        panelOpen={panelOpen} onTogglePanel={() => setPanelOpen((o) => !o)}
        canCreate={canCreate} rows={filtered} seeCommission={seeCommission}
      />

      <JobsFilterPanel
        open={panelOpen} value={filters} options={options}
        onApply={(f) => setFilters(f)} onReset={() => setFilters(EMPTY_FILTERS)} onClose={() => setPanelOpen(false)}
      />

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{filtered.length} 件</span>
      </div>

      <JobsTable
        rows={filtered} sort={sort} onSort={onSort}
        canEdit={canEdit} canDelete={canDelete} onDelete={setDelId} onDuplicate={doDuplicate} busyId={busyId}
      />
      <JobsMobileCards
        rows={filtered} canEdit={canEdit} canDelete={canDelete}
        onDelete={setDelId} onDuplicate={doDuplicate} busyId={busyId}
      />

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
