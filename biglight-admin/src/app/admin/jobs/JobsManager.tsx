"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JobsToolbar } from "@/components/admin/jobs/JobsToolbar";
import { JobsFilterPanel } from "@/components/admin/jobs/JobsFilterPanel";
import { JobsTable } from "@/components/admin/jobs/JobsTable";
import { JobsMobileCards } from "@/components/admin/jobs/JobsMobileCards";
import { EMPTY_FILTERS, activeFilterCount, salaryValue, type JobRow, type Filters, type SortKey, type SortDir } from "./types";
import { requestDelete } from "@/lib/adminDelete";

const uniq = (a: (string | null)[]) => Array.from(new Set(a.filter((x): x is string => !!x))).sort();

export function JobsManager({
  rows, seeCommission, canCreate, canEdit, canDelete, canBulkDelete = false,
}: {
  rows: JobRow[];
  seeCommission: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canBulkDelete?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "updatedAt", dir: "desc" });
  const [delId, setDelId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [delBusy, setDelBusy] = useState(false);
  const toggleSel = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

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
    const r = await requestDelete("job", [delId]);
    setDelId(null);
    if (r.ok) router.refresh(); else alert(r.error);
  }
  async function bulkDelete() {
    const ids = [...sel];
    if (!ids.length || delBusy) return;
    if (!window.confirm(`選択した${ids.length}件の求人を削除します。元に戻せません。よろしいですか？`)) return;
    setDelBusy(true);
    const r = await requestDelete("job", ids);
    setDelBusy(false);
    if (r.ok) { setSel(new Set()); router.refresh(); } else alert(r.error);
  }
  const allSel = filtered.length > 0 && filtered.every((j) => sel.has(j.id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(filtered.map((j) => j.id)));
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
        {canBulkDelete && sel.size > 0 && (
          <button onClick={bulkDelete} disabled={delBusy} className="btn btn-sm gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" /></svg>
            選択削除（{sel.size}）
          </button>
        )}
      </div>

      <JobsTable
        rows={filtered} sort={sort} onSort={onSort}
        canEdit={canEdit} canDelete={canDelete} onDelete={setDelId} onDuplicate={doDuplicate} busyId={busyId}
        canBulkDelete={canBulkDelete} selected={sel} onToggleSel={toggleSel} allSel={allSel} onToggleAll={toggleAll}
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
