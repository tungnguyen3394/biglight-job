"use client";

import { useEffect, useState } from "react";
import { PUBLIC_STATUS_LABEL } from "@/lib/constants";
import { EMPTY_FILTERS, type Filters } from "@/app/admin/jobs/types";

export function JobsFilterPanel({
  open, value, options, onApply, onReset, onClose,
}: {
  open: boolean;
  value: Filters;
  options: { industries: string[]; locations: string[]; staffs: string[] };
  onApply: (f: Filters) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<Filters>(value);
  useEffect(() => { if (open) setD(value); }, [open, value]);
  const set = (k: keyof Filters, v: string) => setD((p) => ({ ...p, [k]: v }));
  if (!open) return null;

  const Sel = ({ label, k, opts, all }: { label: string; k: keyof Filters; opts: string[]; all: string }) => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      <select className="input" value={d[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">{all}</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl lg:static lg:z-auto lg:max-h-none lg:rounded-2xl lg:shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <h3 className="text-sm font-bold text-ink">フィルター</h3>
          <button onClick={onClose} className="text-slate-400"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Sel label="業種" k="industry" opts={options.industries} all="すべて" />
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">公開ステータス</label>
            <select className="input" value={d.publicStatus} onChange={(e) => set("publicStatus", e.target.value)}>
              <option value="">すべて</option>
              {Object.entries(PUBLIC_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">寮</label>
            <select className="input" value={d.dorm} onChange={(e) => set("dorm", e.target.value)}><option value="">すべて</option><option value="1">寮あり</option><option value="0">寮なし</option></select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">夜勤</label>
            <select className="input" value={d.night} onChange={(e) => set("night", e.target.value)}><option value="">すべて</option><option value="1">夜勤あり</option><option value="0">夜勤なし</option></select>
          </div>
          <Sel label="勤務地" k="location" opts={options.locations} all="すべて" />
          <Sel label="担当者" k="staff" opts={options.staffs} all="すべて" />
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">更新日（から）</label>
            <input type="date" className="input" value={d.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">更新日（まで）</label>
            <input type="date" className="input" value={d.dateTo} onChange={(e) => set("dateTo", e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => { setD(EMPTY_FILTERS); onReset(); }} className="btn btn-ghost">リセット</button>
          <button onClick={() => { onApply(d); onClose(); }} className="btn btn-navy">適用</button>
        </div>
      </div>
    </>
  );
}
