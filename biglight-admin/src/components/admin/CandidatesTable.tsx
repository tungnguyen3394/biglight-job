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
  address: string | null;
  createdAt: string;
  lastActive: string;
  hasSNS: boolean;
  status: string;
  apps: number;
};

const PAGE = 20;
type Quick = "" | "thisWeek" | "incomplete" | "hasSNS";
const DAY = 86400000;

// Đầu tuần hiện tại (Thứ 2, 00:00 giờ địa phương).
function startOfWeek(): number {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}
// Hồ sơ chưa đủ: thiếu 1 trong 電話番号/国籍/在留資格/日本語/現在の住所.
function isIncomplete(r: CandidateRow): boolean {
  return !r.phone || !r.nationality || !r.visaType || !r.japaneseLevel || !r.address;
}

function Avatar({ name, image, ring }: { name: string; image: string | null; ring?: boolean }) {
  const r = ring ? "ring-2 ring-white" : "";
  if (image) return <img src={image} alt={name} className={`h-8 w-8 rounded-full object-cover ${r}`} />;
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy ${r}`}>{initial}</span>;
}

function uniq(list: (string | null)[]) {
  return Array.from(new Set(list.filter((x): x is string => !!x))).sort();
}

// Các cột có thể hiển thị / xuất CSV / in.
type ColKey = "name" | "kana" | "nationality" | "phone" | "email" | "visaType" | "japaneseLevel" | "address" | "apps" | "status" | "createdAt";
const COLUMNS: { key: ColKey; label: string; value: (r: CandidateRow) => string }[] = [
  { key: "name", label: "氏名", value: (r) => r.name || "" },
  { key: "kana", label: "フリガナ", value: (r) => r.kana || "" },
  { key: "nationality", label: "国籍", value: (r) => r.nationality || "" },
  { key: "phone", label: "電話番号", value: (r) => r.phone || "" },
  { key: "email", label: "メール", value: (r) => r.email || "" },
  { key: "visaType", label: "在留資格", value: (r) => r.visaType || "" },
  { key: "japaneseLevel", label: "日本語", value: (r) => r.japaneseLevel || "" },
  { key: "address", label: "現在の住所", value: (r) => r.address || "" },
  { key: "apps", label: "応募数", value: (r) => String(r.apps) },
  { key: "status", label: "ステータス", value: (r) => r.status },
  { key: "createdAt", label: "登録日", value: (r) => r.createdAt.slice(0, 10) },
];
const DEFAULT_COLS: ColKey[] = ["name", "nationality", "phone", "email", "visaType", "japaneseLevel", "createdAt", "status"];
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function CandidatesTable({ rows }: { rows: CandidateRow[] }) {
  const [q, setQ] = useState("");
  const [fNat, setFNat] = useState("");
  const [fVisa, setFVisa] = useState("");
  const [fJp, setFJp] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "name" | "active">("new");
  const [quick, setQuick] = useState<Quick>("");
  const [page, setPage] = useState(0);
  const [cols, setCols] = useState<Set<ColKey>>(() => new Set(DEFAULT_COLS));
  const visCols = COLUMNS.filter((c) => cols.has(c.key));
  const toggleCol = (k: ColKey) => setCols((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const nats = useMemo(() => uniq(rows.map((r) => r.nationality)), [rows]);
  const visas = useMemo(() => uniq(rows.map((r) => r.visaType)), [rows]);
  const jps = useMemo(() => uniq(rows.map((r) => r.japaneseLevel)), [rows]);

  // ----- số liệu cho dashboard mini -----
  const insight = useMemo(() => {
    const wk = startOfWeek();
    const now = Date.now();
    const newThisWeek = rows.filter((r) => new Date(r.createdAt).getTime() >= wk).length;
    const incomplete = rows.filter(isIncomplete).length;
    const sns = rows.filter((r) => r.hasSNS).length;
    const active = rows.filter((r) => now - new Date(r.lastActive).getTime() < 14 * DAY).length;
    const topActive = [...rows].sort((a, b) => b.lastActive.localeCompare(a.lastActive)).slice(0, 5);
    return { newThisWeek, incomplete, sns, active, topActive };
  }, [rows]);

  const reset = () => setPage(0);
  const toggleQuick = (k: Quick) => { setQuick((p) => (p === k ? "" : k)); reset(); };

  const filtered = useMemo(() => {
    const wk = startOfWeek();
    let out = rows.filter((r) => {
      if (fNat && r.nationality !== fNat) return false;
      if (fVisa && r.visaType !== fVisa) return false;
      if (fJp && r.japaneseLevel !== fJp) return false;
      if (quick === "thisWeek" && new Date(r.createdAt).getTime() < wk) return false;
      if (quick === "incomplete" && !isIncomplete(r)) return false;
      if (quick === "hasSNS" && !r.hasSNS) return false;
      if (q) {
        const t = `${r.name}${r.kana ?? ""}${r.phone ?? ""}${r.email ?? ""}${r.nationality ?? ""}${r.visaType ?? ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sort === "name") return (a.kana || a.name).localeCompare(b.kana || b.name, "ja");
      if (sort === "active") return b.lastActive.localeCompare(a.lastActive);
      const da = a.createdAt, db = b.createdAt;
      return sort === "new" ? db.localeCompare(da) : da.localeCompare(db);
    });
    return out;
  }, [rows, q, fNat, fVisa, fJp, sort, quick]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const view = filtered.slice(cur * PAGE, cur * PAGE + PAGE);

  const QUICK_LABEL: Record<Exclude<Quick, "">, string> = {
    thisWeek: "今週の新規登録",
    incomplete: "プロフィール未完成",
    hasSNS: "SNS登録あり",
  };

  // ----- xuất CSV (theo cột hiển thị + kết quả đã lọc) -----
  function exportCsv() {
    const header = visCols.map((c) => c.label);
    const body = filtered.map((r) => visCols.map((c) => c.value(r)));
    const csv = [header, ...body].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `応募者一覧_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // ----- in (mở cửa sổ in với bảng đã lọc) -----
  function printList() {
    const w = window.open("", "_blank");
    if (!w) return;
    const head = visCols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
    const body = filtered.map((r) => `<tr>${visCols.map((c) => `<td>${escapeHtml(c.value(r))}</td>`).join("")}</tr>`).join("");
    w.document.write(`<!doctype html><meta charset="utf-8"><title>応募者一覧</title><style>body{font-family:'Noto Sans JP',sans-serif;padding:20px;color:#16181d}h1{font-size:18px;margin:0 0 4px}.meta{color:#6b7280;font-size:12px;margin-bottom:10px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f3f4f6}</style><h1>応募者一覧（${filtered.length}名）</h1><div class="meta">${new Date().toLocaleString("ja-JP")}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
    w.document.close(); w.focus(); w.print();
  }

  function renderCell(key: ColKey, r: CandidateRow) {
    switch (key) {
      case "name":
        return <><Link href={`/admin/candidates/${r.id}`} className="font-semibold text-navy hover:underline">{r.name || "（未入力）"}</Link>{r.kana && <div className="text-xs text-slate-400">{r.kana}</div>}</>;
      case "email":
        return <span className="block max-w-[180px] truncate" title={r.email ?? ""}>{r.email ?? "—"}</span>;
      case "status":
        return <span className="badge bg-slate-100 text-slate-600">{r.status}</span>;
      case "createdAt":
        return <span className="whitespace-nowrap text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("ja-JP")}</span>;
      case "phone":
        return <span className="whitespace-nowrap">{r.phone ?? "—"}</span>;
      default: {
        const v = COLUMNS.find((c) => c.key === key)?.value(r) ?? "";
        return v || "—";
      }
    }
  }

  return (
    <div>
      {/* ===== Dashboard mini (insight) ===== */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightCard
          icon={<><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5 1 0 2 .2 2.8.6" /><path d="M17 8v6M14 11h6" /></>}
          label="今週の新規登録" value={insight.newThisWeek}
          actionLabel="今週の新規を見る" active={quick === "thisWeek"} onAction={() => toggleQuick("thisWeek")}
        />
        <InsightCard
          icon={<><path d="M3 12h4l2 6 4-14 2 8h6" /></>}
          label="アクティブユーザー" value={insight.active} sub="直近14日"
          actionLabel="アクティブ順に並べる" active={sort === "active"} onAction={() => { setSort("active"); }}
        >
          <div className="mt-2 flex -space-x-2">
            {insight.topActive.map((r) => (
              <Link key={r.id} href={`/admin/candidates/${r.id}`} title={r.name} className="transition hover:-translate-y-0.5">
                <Avatar name={r.name} image={r.image} ring />
              </Link>
            ))}
          </div>
        </InsightCard>
        <InsightCard
          icon={<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>}
          label="プロフィール未完成" value={insight.incomplete} accent
          actionLabel="未完成を見る" active={quick === "incomplete"} onAction={() => toggleQuick("incomplete")}
        />
        <InsightCard
          icon={<><path d="M18 8a3 3 0 1 0-2.8-4M6 12a3 3 0 1 0 0 .01M18 16a3 3 0 1 0-2.8 4M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>}
          label="SNS登録あり" value={insight.sns}
          actionLabel="SNSありを見る" active={quick === "hasSNS"} onAction={() => toggleQuick("hasSNS")}
        />
      </div>

      <div className="card">
      {/* quick filter chip */}
      {quick && (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bl-redsoft px-2.5 py-1 font-semibold text-bl-red">
            絞り込み：{QUICK_LABEL[quick]}
            <button onClick={() => { setQuick(""); reset(); }} className="text-bl-red/70 hover:text-bl-red">✕</button>
          </span>
        </div>
      )}
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
          <option value="active">アクティブ順（最近の利用）</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <details className="relative">
            <summary className="btn btn-ghost btn-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden">表示項目</summary>
            <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {COLUMNS.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={cols.has(c.key)} onChange={() => toggleCol(c.key)} className="h-3.5 w-3.5 accent-bl-red" />
                  {c.label}
                </label>
              ))}
            </div>
          </details>
          <button onClick={exportCsv} className="btn btn-ghost btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>CSV</button>
          <button onClick={printList} className="btn btn-ghost btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>印刷</button>
          <span className="text-sm text-slate-500">{filtered.length} 名</span>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="p-3"></th>
              {visCols.map((c) => <th key={c.key} className="whitespace-nowrap p-3">{c.label}</th>)}
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-3"><Avatar name={r.name} image={r.image} /></td>
                {visCols.map((c) => <td key={c.key} className="p-3">{renderCell(c.key, r)}</td>)}
                <td className="p-3">
                  <Link href={`/admin/candidates/${r.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">
                    詳細
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </Link>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr><td colSpan={visCols.length + 2} className="p-10 text-center text-slate-400">該当する応募者がいません</td></tr>
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
    </div>
  );
}

function InsightCard({
  icon, label, value, sub, actionLabel, onAction, active, accent, children,
}: {
  icon: React.ReactNode; label: string; value: number; sub?: string;
  actionLabel: string; onAction: () => void; active?: boolean; accent?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition ${active ? "border-bl-red ring-1 ring-bl-red" : "border-slate-200"}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-bl-redsoft text-bl-red" : "bg-slate-100 text-slate-500"}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </span>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-3xl font-black leading-none ${accent ? "text-bl-red" : "text-ink"}`}>{value}</span>
        {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
        <span className="text-xs text-slate-400">名</span>
      </div>
      {children}
      <button
        onClick={onAction}
        className={`mt-3 inline-flex w-fit items-center gap-1 text-xs font-bold transition ${active ? "text-bl-red" : "text-slate-500 hover:text-bl-red"}`}
      >
        {actionLabel}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  );
}
