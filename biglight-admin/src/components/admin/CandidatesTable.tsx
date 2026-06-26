"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CandidateRow = {
  id: string;
  name: string;
  kana: string | null;
  image: string | null;
  nationality: string | null;
  phone: string | null;
  email: string | null;
  visaType: string | null;
  japaneseLevel: string | null;
  createdAt: string;
  status: string;
  apps: number;
};

const PAGE = 20;

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) return <img src={image} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy">{initial}</span>;
}

function uniq(list: (string | null)[]) {
  return Array.from(new Set(list.filter((x): x is string => !!x))).sort();
}

export function CandidatesTable({ rows }: { rows: CandidateRow[] }) {
  const [q, setQ] = useState("");
  const [fNat, setFNat] = useState("");
  const [fVisa, setFVisa] = useState("");
  const [fJp, setFJp] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "name">("new");
  const [page, setPage] = useState(0);

  const nats = useMemo(() => uniq(rows.map((r) => r.nationality)), [rows]);
  const visas = useMemo(() => uniq(rows.map((r) => r.visaType)), [rows]);
  const jps = useMemo(() => uniq(rows.map((r) => r.japaneseLevel)), [rows]);

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
      if (fNat && r.nationality !== fNat) return false;
      if (fVisa && r.visaType !== fVisa) return false;
      if (fJp && r.japaneseLevel !== fJp) return false;
      if (q) {
        const t = `${r.name}${r.kana ?? ""}${r.phone ?? ""}${r.email ?? ""}${r.nationality ?? ""}${r.visaType ?? ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sort === "name") return (a.kana || a.name).localeCompare(b.kana || b.name, "ja");
      const da = a.createdAt, db = b.createdAt;
      return sort === "new" ? db.localeCompare(da) : da.localeCompare(db);
    });
    return out;
  }, [rows, q, fNat, fVisa, fJp, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const view = filtered.slice(cur * PAGE, cur * PAGE + PAGE);
  const reset = () => setPage(0);

  return (
    <div className="card">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <div className="relative max-w-xs flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input className="input pl-9" placeholder="氏名・電話・メールで検索" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />
        </div>
        <select className="input w-auto" value={fNat} onChange={(e) => { setFNat(e.target.value); reset(); }}>
          <option value="">国籍：すべて</option>{nats.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select className="input w-auto" value={fVisa} onChange={(e) => { setFVisa(e.target.value); reset(); }}>
          <option value="">在留資格：すべて</option>{visas.map((v) => <option key={v}>{v}</option>)}
        </select>
        <select className="input w-auto" value={fJp} onChange={(e) => { setFJp(e.target.value); reset(); }}>
          <option value="">日本語：すべて</option>{jps.map((j) => <option key={j}>{j}</option>)}
        </select>
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="new">登録日：新しい順</option>
          <option value="old">登録日：古い順</option>
          <option value="name">氏名：あいうえお順</option>
        </select>
        <span className="ml-auto text-sm text-slate-500">{filtered.length} 名</span>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="p-3"></th>
              <th className="p-3">氏名</th>
              <th className="p-3">国籍</th>
              <th className="p-3">電話番号</th>
              <th className="p-3">メール</th>
              <th className="p-3">在留資格</th>
              <th className="p-3">日本語</th>
              <th className="p-3">登録日</th>
              <th className="p-3">ステータス</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-3"><Avatar name={r.name} image={r.image} /></td>
                <td className="p-3">
                  <Link href={`/admin/candidates/${r.id}`} className="font-semibold text-navy hover:underline">{r.name || "（未入力）"}</Link>
                  {r.kana && <div className="text-xs text-slate-400">{r.kana}</div>}
                </td>
                <td className="p-3">{r.nationality ?? "—"}</td>
                <td className="p-3 whitespace-nowrap">{r.phone ?? "—"}</td>
                <td className="p-3 max-w-[180px] truncate" title={r.email ?? ""}>{r.email ?? "—"}</td>
                <td className="p-3">{r.visaType ?? "—"}</td>
                <td className="p-3">{r.japaneseLevel ?? "—"}</td>
                <td className="p-3 whitespace-nowrap text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("ja-JP")}</td>
                <td className="p-3"><span className="badge bg-slate-100 text-slate-600">{r.status}</span></td>
                <td className="p-3">
                  <Link href={`/admin/candidates/${r.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">
                    詳細
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </Link>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr><td colSpan={10} className="p-10 text-center text-slate-400">該当する応募者がいません</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-3 text-sm">
          <span className="text-slate-500">{cur * PAGE + 1}–{Math.min((cur + 1) * PAGE, filtered.length)} / {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button disabled={cur === 0} onClick={() => setPage(cur - 1)} className="btn btn-ghost px-3 py-1.5 disabled:opacity-40">前へ</button>
            <span className="px-2 text-slate-600">{cur + 1} / {pages}</span>
            <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="btn btn-ghost px-3 py-1.5 disabled:opacity-40">次へ</button>
          </div>
        </div>
      )}
    </div>
  );
}
