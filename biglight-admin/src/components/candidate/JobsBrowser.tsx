"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "./Shell";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useLoginModal } from "./useLoginModal";
import { PREFECTURES } from "@/lib/prefectures";
import { RESIDENCE_LABEL } from "@/lib/constants";
import { recommendScore } from "@/lib/recommend";
import { JP_LEVELS } from "@/lib/candidateFields";

export type BrowseJob = {
  id: string; code: string; title: string; industry: string; jobType: string | null;
  prefecture: string; city: string | null; salaryMain: string | null; salaryValue: number;
  recruitCount: number; dormitory: boolean; nightShift: boolean; japaneseLevel: string | null;
  gender: string; residence: string; isFeatured: boolean; isRecommended: boolean; isUrgent: boolean;
  open: boolean; createdAt: string; updatedAt: string; tags: string[]; img: string;
};

type Filters = { q: string; pref: string; industry: string; tag: string; salaryMin: string; jp: string; dorm: string };
const EMPTY: Filters = { q: "", pref: "", industry: "", tag: "", salaryMin: "", jp: "", dorm: "" };

const SORTS: { v: string; label: string }[] = [
  { v: "new", label: "新着順" },
  { v: "salaryHigh", label: "給与が高い順" },
  { v: "salaryLow", label: "給与が低い順" },
  { v: "recruit", label: "募集人数が多い順" },
  { v: "jp", label: "日本語レベル順" },
  { v: "pref", label: "都道府県順" },
  { v: "updated", label: "更新日順" },
];

// Cột リスト表示 (chỉ đổi thứ tự/ẩn hiện ở frontend — không động DB).
const COLUMNS: { key: string; label: string; w: number }[] = [
  { key: "title", label: "求人タイトル", w: 240 },
  { key: "industry", label: "分野", w: 130 },
  { key: "pref", label: "都道府県", w: 90 },
  { key: "city", label: "市区町村", w: 110 },
  { key: "salary", label: "給与", w: 140 },
  { key: "jp", label: "日本語", w: 80 },
  { key: "dorm", label: "寮", w: 72 },
  { key: "recruit", label: "募集人数", w: 84 },
  { key: "published", label: "公開日", w: 100 },
  { key: "detail", label: "詳細", w: 64 },
  { key: "apply", label: "応募", w: 64 },
];
const ALL_KEYS = COLUMNS.map((c) => c.key);
const COL: Record<string, { key: string; label: string; w: number }> = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));

function Ico({ d, size = 14 }: { d: React.ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">{d}</svg>;
}
const I_PIN = <><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>;
const I_YEN = <><path d="M12 4l5 7M12 4 7 11M12 11v9M8 13h8M8 16.5h8" /></>;
const sel = "w-full rounded-xl border border-bl-line bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-bl-red";
const fmtDate = (iso: string) => iso.slice(0, 10);

function cellText(j: BrowseJob, key: string): string {
  switch (key) {
    case "title": return j.title;
    case "industry": return j.industry;
    case "pref": return j.prefecture;
    case "city": return j.city ?? "";
    case "salary": return j.salaryMain ?? "";
    case "jp": return j.japaneseLevel ?? "";
    case "dorm": return j.dormitory ? "寮あり" : "寮なし";
    case "recruit": return `${j.recruitCount}名`;
    case "published": return fmtDate(j.createdAt);
    default: return "";
  }
}

function Card({ job, saved, onToggleSave, onApply, loggedIn }: { job: BrowseJob; saved: boolean; onToggleSave: () => void; onApply: () => void; loggedIn?: boolean }) {
  const chip = job.industry.includes("製造") ? "bg-bl-bluesoft text-bl-blue" : job.industry.includes("建設") ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-greensoft text-bl-green";
  const rec = recommendScore(job.id);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-bl-red hover:shadow-lg">
      <Link href={`/jobs/${job.id}`} className="relative block h-32 overflow-hidden">
        <img src={job.img} alt="" className="h-full w-full object-cover" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {job.open && job.isUrgent && <span className="rounded-full bg-bl-red px-2 py-0.5 text-[11px] font-black text-white shadow">急募</span>}
          {!job.open && <span className="rounded-full bg-bl-gray px-2 py-0.5 text-[11px] font-bold text-white">募集終了</span>}
        </div>
        {/* おすすめ度 (mock) — nhỏ; guest không thấy điểm */}
        {loggedIn
          ? <span className="absolute bottom-2 left-2.5 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-black text-bl-red shadow-sm">★ おすすめ度 {rec.score}%</span>
          : <span className="absolute bottom-2 left-2.5 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-bl-gray2 shadow-sm">おすすめ度 ログイン後</span>}
        <button onClick={(e) => { e.preventDefault(); onToggleSave(); }} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg leading-none shadow hover:bg-white" aria-label="お気に入り">
          <span className={saved ? "text-bl-red" : "text-bl-gray2"}>{saved ? "♥" : "♡"}</span>
        </button>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 font-mono text-[11px] font-bold text-bl-gray2">{job.code}</div>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip}`}>{job.industry}</span>
          <span className="rounded-full bg-bl-redsoft px-2 py-0.5 text-[11px] font-bold text-bl-red">{RESIDENCE_LABEL[job.residence] ?? "特定技能"}</span>
        </div>
        <Link href={`/jobs/${job.id}`} className="line-clamp-2 text-[15px] font-bold leading-snug hover:text-bl-red">{job.title}</Link>
        {job.salaryMain && <div className="mt-1.5 flex items-center gap-1 text-sm font-black text-bl-red"><Ico d={I_YEN} />{job.salaryMain}</div>}
        <div className="mt-1 flex items-center gap-1 text-xs text-bl-gray"><Ico d={I_PIN} />{job.prefecture}{job.city ? ` ${job.city}` : ""}{job.jobType ? `・${job.jobType}` : ""}</div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className={`rounded-full px-2 py-0.5 ${job.dormitory ? "bg-bl-greensoft text-bl-green" : "bg-bl-bg text-bl-gray2"}`}>{job.dormitory ? "寮あり" : "寮なし"}</span>
          {job.japaneseLevel && <span className="rounded-full bg-bl-bluesoft px-2 py-0.5 text-bl-blue">日本語 {job.japaneseLevel}</span>}
          <span className="rounded-full bg-bl-bg px-2 py-0.5 text-bl-gray">募集 {job.recruitCount}名</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={`/jobs/${job.id}`} className="flex-1 rounded-xl border border-bl-line py-2 text-center text-xs font-bold text-bl-gray hover:border-bl-red hover:text-bl-red">詳細を見る</Link>
          <button onClick={onApply} className="flex-1 rounded-xl bg-bl-red py-2 text-center text-xs font-bold text-white hover:bg-bl-redd">応募する</button>
        </div>
      </div>
    </div>
  );
}

export default function JobsBrowser({ items, loggedIn, savedIds = [] }: { items: BrowseJob[]; loggedIn?: boolean; savedIds?: string[] }) {
  const router = useRouter();
  const { onRegister, modal } = useLoginModal();
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState("new");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [savedSet, setSavedSet] = useState<Set<string>>(() => new Set(savedIds));
  const [menu, setMenu] = useState<null | "filter" | "sort" | "cols">(null);
  const [visible, setVisible] = useState<Set<string>>(() => new Set(ALL_KEYS));
  const [colOrder, setColOrder] = useState<string[]>(ALL_KEYS);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const set = (k: keyof Filters, v: string) => setF((p) => ({ ...p, [k]: v }));

  // load persisted (sau mount → tránh hydration mismatch)
  useEffect(() => {
    try {
      const v = localStorage.getItem("bl_jobs_view"); if (v === "grid" || v === "list") setView(v);
      const s = localStorage.getItem("bl_jobs_sort"); if (s && SORTS.some((x) => x.v === s)) setSort(s);
      const cols = JSON.parse(localStorage.getItem("bl_jobs_cols") || "null"); if (Array.isArray(cols)) setVisible(new Set(cols.filter((k) => ALL_KEYS.includes(k))));
      const ord = JSON.parse(localStorage.getItem("bl_jobs_colorder") || "null");
      if (Array.isArray(ord)) { const clean = ord.filter((k) => ALL_KEYS.includes(k)); setColOrder([...clean, ...ALL_KEYS.filter((k) => !clean.includes(k))]); }
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("bl_jobs_view", view); }, [view, ready]);
  useEffect(() => { if (ready) localStorage.setItem("bl_jobs_sort", sort); }, [sort, ready]);
  useEffect(() => { if (ready) localStorage.setItem("bl_jobs_cols", JSON.stringify([...visible])); }, [visible, ready]);
  useEffect(() => { if (ready) localStorage.setItem("bl_jobs_colorder", JSON.stringify(colOrder)); }, [colOrder, ready]);

  function toggleSave(id: string) {
    if (!loggedIn) { router.push("/mypage"); return; }
    setSavedSet((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    fetch("/api/candidate/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
  }
  // Chưa đăng nhập → mở modal đăng ký (sau khi đăng ký quay lại mở form ứng tuyển).
  function onApply(job: BrowseJob) {
    const href = `/mypage?apply=${encodeURIComponent(job.id)}&t=${encodeURIComponent(job.title)}`;
    if (loggedIn) router.push(href); else onRegister(href);
  }

  const uniq = (a: (string | null)[]) => Array.from(new Set(a.filter((x): x is string => !!x))).sort();
  const industries = useMemo(() => uniq(items.map((i) => i.industry)), [items]);
  const jps = useMemo(() => uniq(items.map((i) => i.japaneseLevel)), [items]);
  const tags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))).filter(Boolean).sort(), [items]);

  const list = useMemo(() => {
    const kw = f.q.trim().toLowerCase();
    const jpRank = (j: BrowseJob) => { const i = j.japaneseLevel ? JP_LEVELS.indexOf(j.japaneseLevel) : -1; return i < 0 ? 999 : i; };
    const prefRank = (j: BrowseJob) => { const i = PREFECTURES.indexOf(j.prefecture); return i < 0 ? 999 : i; };
    const out = items.filter((j) => {
      if (f.pref && j.prefecture !== f.pref) return false;
      if (f.industry && j.industry !== f.industry) return false;
      if (f.tag && !j.tags.includes(f.tag)) return false;
      if (f.salaryMin && j.salaryValue < Number(f.salaryMin)) return false;
      if (f.dorm === "1" && !j.dormitory) return false;
      if (f.dorm === "0" && j.dormitory) return false;
      if (f.jp && j.japaneseLevel !== f.jp) return false;
      if (kw) { const hay = `${j.title} ${j.prefecture} ${j.city ?? ""} ${j.jobType ?? ""} ${j.industry} ${j.tags.join(" ")}`.toLowerCase(); if (!hay.includes(kw)) return false; }
      return true;
    });
    out.sort((a, b) => {
      if (sort === "salaryHigh") return b.salaryValue - a.salaryValue;
      if (sort === "salaryLow") return a.salaryValue - b.salaryValue;
      if (sort === "recruit") return b.recruitCount - a.recruitCount;
      if (sort === "jp") return jpRank(a) - jpRank(b);
      if (sort === "pref") return prefRank(a) - prefRank(b);
      if (sort === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      // 新着順: 公開日(降順) → 同日なら更新日が新しい順
      const da = a.createdAt.slice(0, 10), db = b.createdAt.slice(0, 10);
      if (da !== db) return db.localeCompare(da);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return out;
  }, [items, f, sort]);

  const total = list.length;
  const activeCount = Object.values(f).filter((v) => v !== "").length;
  const cols = colOrder.filter((k) => visible.has(k));
  const tableWidth = cols.reduce((s, k) => s + (COL[k]?.w ?? 100), 0);

  function exportCsv() {
    const head = cols.map((k) => COL[k].label);
    const rows = list.map((j) => cols.map((k) => (k === "detail" || k === "apply") ? `/jobs/${j.id}` : cellText(j, k)));
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "jobs.csv"; a.click(); URL.revokeObjectURL(a.href);
  }
  function printTable() {
    const w = window.open("", "_blank", "width=1000,height=700"); if (!w) return;
    const head = cols.map((k) => `<th>${COL[k].label}</th>`).join("");
    const body = list.map((j) => "<tr>" + cols.map((k) => `<td>${(k === "detail" || k === "apply") ? `/jobs/${j.id}` : cellText(j, k)}</td>`).join("") + "</tr>").join("");
    w.document.write(`<html><head><meta charset="utf-8"><title>特定技能求人一覧</title><style>body{font-family:sans-serif;padding:16px}h1{font-size:16px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f3f4f6}</style></head><body><h1>特定技能求人一覧（全${total}件）</h1><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 250);
  }
  function onDrop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) { setDragKey(null); return; }
    setColOrder((prev) => { const arr = [...prev]; const from = arr.indexOf(dragKey); const to = arr.indexOf(targetKey); arr.splice(from, 1); arr.splice(to, 0, dragKey); return arr; });
    setDragKey(null);
  }

  // ---------- shared UI pieces ----------
  const empty = <p className="rounded-2xl border border-dashed border-bl-line bg-white p-12 text-center text-bl-gray2">条件に合う求人が見つかりませんでした。</p>;

  const cellNode = (j: BrowseJob, key: string) => {
    if (key === "title") return <Link href={`/jobs/${j.id}`} className="block truncate font-bold text-ink hover:text-bl-red" title={j.title}>{j.title}</Link>;
    if (key === "detail") return <Link href={`/jobs/${j.id}`} className="rounded-lg border border-bl-line px-2 py-1 text-[11px] font-bold text-bl-gray hover:border-bl-red hover:text-bl-red">詳細</Link>;
    if (key === "apply") return <button onClick={() => onApply(j)} className="rounded-lg bg-bl-red px-2 py-1 text-[11px] font-bold text-white hover:bg-bl-redd">応募</button>;
    if (key === "salary") return <span className="font-bold text-bl-red">{cellText(j, key)}</span>;
    return <span className="block truncate" title={cellText(j, key)}>{cellText(j, key) || "—"}</span>;
  };

  const Table = (
    <div className="overflow-x-auto rounded-2xl border border-bl-line bg-white">
      <table className="table-fixed text-sm" style={{ width: Math.max(tableWidth, 320), minWidth: "100%" }}>
        <colgroup>{cols.map((k) => <col key={k} style={{ width: COL[k].w }} />)}</colgroup>
        <thead>
          <tr className="border-b border-bl-line bg-bl-bg text-left text-xs text-bl-gray">
            {cols.map((k) => (
              <th key={k} draggable onDragStart={() => setDragKey(k)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(k)}
                className={`cursor-move select-none truncate px-3 py-2.5 font-bold ${dragKey === k ? "opacity-50" : ""}`} title="ドラッグで並べ替え">{COL[k].label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((j) => (
            <tr key={j.id} className={`h-12 border-b border-bl-line/60 last:border-0 hover:bg-bl-bg ${!j.open ? "opacity-60" : ""}`}>
              {cols.map((k) => <td key={k} className="truncate px-3 py-2 align-middle">{cellNode(j, k)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Grid = list.length === 0 ? empty
    : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((j) => <Card key={j.id} job={j} saved={savedSet.has(j.id)} onToggleSave={() => toggleSave(j.id)} onApply={() => onApply(j)} loggedIn={loggedIn} />)}</div>;
  const Body = list.length === 0 ? empty : view === "grid" ? Grid : Table;

  const ViewToggle = (
    <div className="flex overflow-hidden rounded-lg border border-bl-line">
      <button onClick={() => setView("grid")} className={`flex h-9 w-9 items-center justify-center ${view === "grid" ? "bg-bl-red text-white" : "bg-white text-bl-gray hover:bg-bl-bg"}`} aria-label="カード表示"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg></button>
      <button onClick={() => setView("list")} className={`flex h-9 w-9 items-center justify-center border-l border-bl-line ${view === "list" ? "bg-bl-red text-white" : "bg-white text-bl-gray hover:bg-bl-bg"}`} aria-label="リスト表示"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg></button>
    </div>
  );

  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-bl-line bg-white px-3 py-2 text-sm font-bold text-ink hover:border-bl-red";
  // Mobile (<lg): panel → bottom sheet vừa khít màn hình (không tràn ra ngoài).
  const sheet = "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:mx-auto max-lg:mt-0 max-lg:w-[calc(100vw-32px)] max-lg:max-w-[380px] max-lg:max-h-[80dvh] max-lg:overflow-y-auto max-lg:rounded-2xl max-lg:rounded-b-none max-lg:p-4 max-lg:pb-[calc(16px+env(safe-area-inset-bottom))] max-lg:shadow-2xl";
  const Toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Overlay mờ — chỉ mobile, bấm ngoài để đóng */}
      {menu && <div onClick={() => setMenu(null)} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />}
      {ViewToggle}
      {/* フィルタ */}
      <div className="relative">
        <button onClick={() => setMenu(menu === "filter" ? null : "filter")} className={btn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
          フィルタ{activeCount > 0 && <span className="rounded-full bg-bl-red px-1.5 text-[10px] font-bold text-white">{activeCount}</span>}
        </button>
        {menu === "filter" && (
          <div className={`absolute right-0 z-50 mt-2 w-[min(92vw,360px)] rounded-2xl border border-bl-line bg-white p-4 shadow-xl ${sheet}`}>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2"><label className="mb-1 block text-xs font-bold text-bl-gray">キーワード</label><input className={sel} value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="職種・タグなど" /></div>
              <div><label className="mb-1 block text-xs font-bold text-bl-gray">地域</label><select className={sel} value={f.pref} onChange={(e) => set("pref", e.target.value)}><option value="">すべて</option>{PREFECTURES.map((p) => <option key={p}>{p}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold text-bl-gray">特定技能分野</label><select className={sel} value={f.industry} onChange={(e) => set("industry", e.target.value)}><option value="">すべて</option>{industries.map((i) => <option key={i}>{i}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold text-bl-gray">タグ</label><select className={sel} value={f.tag} onChange={(e) => set("tag", e.target.value)}><option value="">すべて</option>{tags.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold text-bl-gray">給与（下限）</label><select className={sel} value={f.salaryMin} onChange={(e) => set("salaryMin", e.target.value)}><option value="">指定なし</option><option value="200000">月20万円〜</option><option value="250000">月25万円〜</option><option value="300000">月30万円〜</option></select></div>
              <div><label className="mb-1 block text-xs font-bold text-bl-gray">日本語レベル</label><select className={sel} value={f.jp} onChange={(e) => set("jp", e.target.value)}><option value="">すべて</option>{jps.map((j) => <option key={j}>{j}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold text-bl-gray">寮</label><select className={sel} value={f.dorm} onChange={(e) => set("dorm", e.target.value)}><option value="">すべて</option><option value="1">寮あり</option><option value="0">寮なし</option></select></div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setF(EMPTY)} className="flex-1 rounded-xl border border-bl-line py-2.5 text-sm font-bold text-bl-gray">条件クリア</button>
              <button onClick={() => setMenu(null)} className="flex-1 rounded-xl bg-bl-red py-2.5 text-sm font-bold text-white">検索する（{total}件）</button>
            </div>
          </div>
        )}
      </div>
      {/* 並び替え */}
      <div className="relative">
        <button onClick={() => setMenu(menu === "sort" ? null : "sort")} className={btn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h12M3 12h8M3 18h5M17 6v12M17 18l3-3M17 18l-3-3" /></svg>
          並び替え
        </button>
        {menu === "sort" && (
          <div className={`absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-bl-line bg-white py-1 shadow-xl ${sheet}`}>
            {SORTS.map((s) => <button key={s.v} onClick={() => { setSort(s.v); setMenu(null); }} className={`block w-full px-4 py-2 text-left text-sm hover:bg-bl-bg ${sort === s.v ? "font-bold text-bl-red" : "text-ink"}`}>{s.label}</button>)}
          </div>
        )}
      </div>
      {/* 表示項目 (list only) */}
      {view === "list" && (
        <div className="relative">
          <button onClick={() => setMenu(menu === "cols" ? null : "cols")} className={btn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
            表示項目
          </button>
          {menu === "cols" && (
            <div className={`absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-bl-line bg-white p-3 shadow-xl ${sheet}`}>
              <div className="mb-2 flex gap-2">
                <button onClick={() => setVisible(new Set(ALL_KEYS))} className="flex-1 rounded-lg bg-bl-bg py-1 text-xs font-bold text-ink">すべて選択</button>
                <button onClick={() => setVisible(new Set(["title"]))} className="flex-1 rounded-lg bg-bl-bg py-1 text-xs font-bold text-ink">クリア</button>
              </div>
              <div className="max-h-60 space-y-0.5 overflow-y-auto">
                {colOrder.map((k) => (
                  <label key={k} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-bl-bg">
                    <input type="checkbox" checked={visible.has(k)} disabled={k === "title"} onChange={(e) => setVisible((s) => { const n = new Set(s); if (e.target.checked) n.add(k); else n.delete(k); n.add("title"); return n; })} className="h-4 w-4 accent-bl-red" />
                    {COL[k].label}
                  </label>
                ))}
              </div>
              <p className="mt-2 px-1 text-[10px] text-bl-gray2">列はドラッグで並べ替えできます。</p>
            </div>
          )}
        </div>
      )}
      {/* 印刷・CSV (list only) */}
      {view === "list" && <>
        <button onClick={printTable} className={btn}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 14h12v7H6z" /></svg>印刷</button>
        <button onClick={exportCsv} className={btn}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>CSV</button>
      </>}
    </div>
  );

  const Inner = (
    <>
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">特定技能求人一覧</h1>
          <p className="mt-0.5 text-sm text-bl-gray">全<span className="px-1 text-lg font-black text-bl-red">{total}</span>件</p>
        </div>
        {Toolbar}
      </div>
      <div className="mt-4">{Body}</div>
    </>
  );

  return (
    <>
      {modal}
      {/* overlay đóng menu khi click ngoài */}
      {menu && <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />}

      {/* DESKTOP */}
      <div className="hidden min-h-screen bg-bl-bg text-ink lg:block">
        <SiteHeader active="jobs" loggedIn={loggedIn} onRegister={onRegister} />
        <div className="mx-auto max-w-6xl px-6 py-8">{Inner}</div>
        <SiteFooter loggedIn={loggedIn} />
      </div>

      {/* MOBILE */}
      <div className="lg:hidden">
        <Shell active="jobs" searchValue={f.q} onSearchChange={(v) => set("q", v)} loggedIn={loggedIn}>
          <div className="px-4 py-4">{Inner}</div>
        </Shell>
      </div>

      <MessengerPopupButton />
    </>
  );
}
