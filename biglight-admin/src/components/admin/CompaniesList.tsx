"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, publicStatusTone } from "@/components/ui/Badge";
import { PUBLIC_STATUS_LABEL, JOB_OP_STATUS_LABEL } from "@/lib/constants";

export type CompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  applicants: number;
  total: number;
  open: number;
  jobs: { id: string; code: string; title: string; opStatus: string; publicStatus: string }[];
};

export function CompaniesList({ rows, canCreateJob }: { rows: CompanyRow[]; canCreateJob: boolean }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => `${r.name}${r.industry ?? ""}${r.contactName ?? ""}`.toLowerCase().includes(t));
  }, [rows, q]);

  const totalOrders = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input className="input pl-9" placeholder="企業名・業種・担当者で検索" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="ml-auto text-sm text-slate-500">{filtered.length} 社 ・ 求人 {totalOrders} 件</span>
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-slate-400">該当する企業がありません</div>
      )}

      <div className="space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/companies/${c.id}`} className="text-base font-black text-ink hover:text-bl-red hover:underline">{c.name}</Link>
                  {c.industry && <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-blue">{c.industry}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                  {c.contactName && <span>担当：{c.contactName}</span>}
                  {c.phone && <span>{c.phone}</span>}
                  {c.email && <span className="truncate">{c.email}</span>}
                </div>
              </div>

              {/* counts */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-ink">{c.total}</div>
                  <div className="text-[10px] font-bold text-slate-400">求人数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-bl-green">{c.open}</div>
                  <div className="text-[10px] font-bold text-slate-400">募集中</div>
                </div>
                <Link href={`/admin/companies/${c.id}`} className="text-center" title="応募者一覧を見る">
                  <div className="text-2xl font-black text-bl-red hover:underline">{c.applicants}</div>
                  <div className="text-[10px] font-bold text-slate-400">応募者数</div>
                </Link>
                <Link href={`/admin/companies/${c.id}`} className="btn btn-ghost gap-1.5 px-3 py-2 text-xs">
                  詳細
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </Link>
                {canCreateJob && (
                  <Link href={`/admin/jobs/new?company=${c.id}`} className="btn btn-ghost gap-1.5 px-3 py-2 text-xs">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    求人追加
                  </Link>
                )}
              </div>
            </div>

            {/* đơn hàng (求人) của công ty */}
            {c.jobs.length > 0 ? (
              <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                {c.jobs.map((j) => (
                  <Link key={j.id} href={`/admin/jobs/${j.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50">
                    <span className="font-mono text-[11px] font-bold text-slate-400">{j.code}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{j.title}</span>
                    <span className="text-[10px] text-slate-400">{JOB_OP_STATUS_LABEL[j.opStatus] ?? j.opStatus}</span>
                    <Badge tone={publicStatusTone(j.publicStatus) as never}>{PUBLIC_STATUS_LABEL[j.publicStatus] ?? j.publicStatus}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">この企業の求人はまだありません。</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
