"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "./Shell";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { PREFECTURES } from "@/lib/prefectures";
import { RESIDENCE_LABEL } from "@/lib/constants";

export type BrowseJob = {
  id: string; title: string; industry: string; jobType: string | null;
  prefecture: string; city: string | null; salaryMain: string | null; salaryValue: number;
  recruitCount: number; dormitory: boolean; nightShift: boolean; japaneseLevel: string | null;
  gender: string; residence: string; isFeatured: boolean; isRecommended: boolean;
  open: boolean; createdAt: string; tags: string[]; img: string;
};

type Filters = { q: string; pref: string; city: string; industry: string; jobType: string; salaryMin: string; dorm: string; night: string; jp: string; gender: string; recruit: string };
const EMPTY: Filters = { q: "", pref: "", city: "", industry: "", jobType: "", salaryMin: "", dorm: "", night: "", jp: "", gender: "", recruit: "" };

function Ico({ d, size = 14 }: { d: React.ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">{d}</svg>;
}
const I_PIN = <><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>;
const I_YEN = <><path d="M12 4l5 7M12 4 7 11M12 11v9M8 13h8M8 16.5h8" /></>;
const I_MOON = <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;
const sel = "w-full rounded-xl border border-bl-line bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-bl-red";

function Card({ job, saved, onToggleSave }: { job: BrowseJob; saved: boolean; onToggleSave: () => void }) {
  const chip = job.industry.includes("製造") ? "bg-bl-bluesoft text-bl-blue" : job.industry.includes("建設") ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-greensoft text-bl-green";
  const applyHref = `/mypage?apply=${encodeURIComponent(job.id)}&t=${encodeURIComponent(job.title)}`;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-bl-red hover:shadow-lg">
      <Link href={`/jobs/${job.id}`} className="relative block h-32 overflow-hidden">
        <img src={job.img} alt="" className="h-full w-full object-cover" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {job.isFeatured && <span className="rounded-full bg-bl-red px-2 py-0.5 text-[11px] font-black text-white shadow">おすすめ</span>}
          {!job.open && <span className="rounded-full bg-bl-gray px-2 py-0.5 text-[11px] font-bold text-white">募集終了</span>}
        </div>
        <button onClick={(e) => { e.preventDefault(); onToggleSave(); }} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg leading-none shadow hover:bg-white" aria-label="お気に入り">
          <span className={saved ? "text-bl-red" : "text-bl-gray2"}>{saved ? "♥" : "♡"}</span>
        </button>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip}`}>{job.industry}</span>
          <span className="rounded-full bg-bl-redsoft px-2 py-0.5 text-[11px] font-bold text-bl-red">{RESIDENCE_LABEL[job.residence] ?? "特定技能"}</span>
        </div>
        <Link href={`/jobs/${job.id}`} className="line-clamp-2 text-[15px] font-bold leading-snug hover:text-bl-red">{job.title}</Link>
        {job.salaryMain && <div className="mt-1.5 flex items-center gap-1 text-sm font-black text-bl-red"><Ico d={I_YEN} />{job.salaryMain}</div>}
        <div className="mt-1 flex items-center gap-1 text-xs text-bl-gray"><Ico d={I_PIN} />{job.prefecture}{job.city ? ` ${job.city}` : ""}{job.jobType ? `・${job.jobType}` : ""}</div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className={`rounded-full px-2 py-0.5 ${job.dormitory ? "bg-bl-greensoft text-bl-green" : "bg-bl-bg text-bl-gray2"}`}>{job.dormitory ? "寮あり" : "寮なし"}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${job.nightShift ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-bg text-bl-gray2"}`}><Ico d={I_MOON} size={11} />{job.nightShift ? "夜勤あり" : "夜勤なし"}</span>
          {job.japaneseLevel && <span className="rounded-full bg-bl-bluesoft px-2 py-0.5 text-bl-blue">日本語 {job.japaneseLevel}</span>}
          <span className="rounded-full bg-bl-bg px-2 py-0.5 text-bl-gray">募集 {job.recruitCount}名</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={`/jobs/${job.id}`} className="flex-1 rounded-xl border border-bl-line py-2 text-center text-xs font-bold text-bl-gray hover:border-bl-red hover:text-bl-red">詳細を見る</Link>
          <Link href={applyHref} className="flex-1 rounded-xl bg-bl-red py-2 text-center text-xs font-bold text-white hover:bg-bl-redd">応募する</Link>
        </div>
      </div>
    </div>
  );
}

export default function JobsBrowser({ items, loggedIn, savedIds = [] }: { items: BrowseJob[]; loggedIn?: boolean; savedIds?: string[] }) {
  const router = useRouter();
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState("new");
  const [drawer, setDrawer] = useState(false);
  const [savedSet, setSavedSet] = useState<Set<string>>(() => new Set(savedIds));
  const set = (k: keyof Filters, v: string) => setF((p) => ({ ...p, [k]: v, ...(k === "pref" ? { city: "" } : {}) }));

  function toggleSave(id: string) {
    if (!loggedIn) { router.push("/mypage"); return; }
    setSavedSet((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    fetch("/api/candidate/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
  }

  const uniq = (a: (string | null)[]) => Array.from(new Set(a.filter((x): x is string => !!x))).sort();
  const industries = useMemo(() => uniq(items.map((i) => i.industry)), [items]);
  const jobTypes = useMemo(() => uniq(items.map((i) => i.jobType)), [items]);
  const jps = useMemo(() => uniq(items.map((i) => i.japaneseLevel)), [items]);
  const cities = useMemo(() => uniq(items.filter((i) => !f.pref || i.prefecture === f.pref).map((i) => i.city)), [items, f.pref]);

  const list = useMemo(() => {
    const kw = f.q.trim().toLowerCase();
    let out = items.filter((j) => {
      if (f.pref && j.prefecture !== f.pref) return false;
      if (f.city && j.city !== f.city) return false;
      if (f.industry && j.industry !== f.industry) return false;
      if (f.jobType && j.jobType !== f.jobType) return false;
      if (f.salaryMin && j.salaryValue < Number(f.salaryMin)) return false;
      if (f.dorm === "1" && !j.dormitory) return false;
      if (f.dorm === "0" && j.dormitory) return false;
      if (f.night === "1" && !j.nightShift) return false;
      if (f.night === "0" && j.nightShift) return false;
      if (f.jp && j.japaneseLevel !== f.jp) return false;
      if (f.gender && j.gender !== f.gender && !(f.gender !== "ANY" && j.gender === "ANY")) return false;
      if (f.recruit === "open" && !j.open) return false;
      if (f.recruit === "closed" && j.open) return false;
      if (kw) { const hay = `${j.title} ${j.prefecture} ${j.city ?? ""} ${j.jobType ?? ""} ${j.industry} ${j.tags.join(" ")}`.toLowerCase(); if (!hay.includes(kw)) return false; }
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sort === "salary") return b.salaryValue - a.salaryValue;
      if (sort === "recruit") return b.recruitCount - a.recruitCount;
      if (sort === "featured") { const s = (x: BrowseJob) => (x.isFeatured ? 2 : x.isRecommended ? 1 : 0); if (s(b) !== s(a)) return s(b) - s(a); return b.createdAt.localeCompare(a.createdAt); }
      return b.createdAt.localeCompare(a.createdAt);
    });
    return out;
  }, [items, f, sort]);

  const activeCount = Object.values(f).filter((v) => v !== "").length;

  const Filters = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">キーワード</label><input className={sel} value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="職種・タグなど" /></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">都道府県</label><select className={sel} value={f.pref} onChange={(e) => set("pref", e.target.value)}><option value="">すべて</option>{PREFECTURES.map((p) => <option key={p}>{p}</option>)}</select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">市区町村</label><select className={sel} value={f.city} onChange={(e) => set("city", e.target.value)}><option value="">すべて</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">業種</label><select className={sel} value={f.industry} onChange={(e) => set("industry", e.target.value)}><option value="">すべて</option>{industries.map((i) => <option key={i}>{i}</option>)}</select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">職種</label><select className={sel} value={f.jobType} onChange={(e) => set("jobType", e.target.value)}><option value="">すべて</option>{jobTypes.map((i) => <option key={i}>{i}</option>)}</select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">給与（下限）</label><select className={sel} value={f.salaryMin} onChange={(e) => set("salaryMin", e.target.value)}><option value="">指定なし</option><option value="200000">月20万円〜</option><option value="250000">月25万円〜</option><option value="300000">月30万円〜</option></select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">寮</label><select className={sel} value={f.dorm} onChange={(e) => set("dorm", e.target.value)}><option value="">すべて</option><option value="1">寮あり</option><option value="0">寮なし</option></select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">夜勤</label><select className={sel} value={f.night} onChange={(e) => set("night", e.target.value)}><option value="">すべて</option><option value="1">夜勤あり</option><option value="0">夜勤なし</option></select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">日本語レベル</label><select className={sel} value={f.jp} onChange={(e) => set("jp", e.target.value)}><option value="">すべて</option>{jps.map((j) => <option key={j}>{j}</option>)}</select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">性別募集</label><select className={sel} value={f.gender} onChange={(e) => set("gender", e.target.value)}><option value="">すべて</option><option value="MALE">男性</option><option value="FEMALE">女性</option><option value="ANY">不問</option></select></div>
      <div><label className="mb-1 block text-xs font-bold text-bl-gray">募集状況</label><select className={sel} value={f.recruit} onChange={(e) => set("recruit", e.target.value)}><option value="">すべて</option><option value="open">募集中</option><option value="closed">募集終了</option></select></div>
    </div>
  );

  const SortBar = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-bl-gray2">並び替え</span>
      <select className="rounded-xl border border-bl-line bg-white px-3 py-2 text-sm font-semibold text-ink" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="new">新着順</option>
        <option value="salary">給与高い順</option>
        <option value="recruit">募集人数多い順</option>
        <option value="featured">おすすめ順</option>
      </select>
    </div>
  );

  const Grid = list.length === 0
    ? <p className="rounded-2xl border border-dashed border-bl-line bg-white p-12 text-center text-bl-gray2">条件に合う求人が見つかりませんでした。</p>
    : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((j) => <Card key={j.id} job={j} saved={savedSet.has(j.id)} onToggleSave={() => toggleSave(j.id)} />)}</div>;

  return (
    <>
      {/* DESKTOP */}
      <div className="hidden min-h-screen bg-bl-bg text-ink lg:block">
        <SiteHeader active="jobs" loggedIn={loggedIn} />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="mb-1 text-2xl font-black">特定技能 求人一覧</h1>
          <p className="mb-5 text-sm text-bl-gray">条件でしぼり込んで、あなたに合う仕事を見つけましょう。</p>
          <div className="grid grid-cols-[260px_1fr] items-start gap-6">
            <aside className="sticky top-20 rounded-2xl border border-bl-line bg-white p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-sm font-black">絞り込み</span>{activeCount > 0 && <button onClick={() => setF(EMPTY)} className="text-xs font-semibold text-bl-gray2 underline">クリア</button>}</div>
              {Filters}
            </aside>
            <div>
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black"><span className="text-bl-red">{list.length}</span>件</h2>{SortBar}</div>
              {Grid}
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>

      {/* MOBILE */}
      <div className="lg:hidden">
        <Shell active="jobs" searchValue={f.q} onSearchChange={(v) => set("q", v)} loggedIn={loggedIn}>
          <div className="px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button onClick={() => setDrawer(true)} className="flex items-center gap-1.5 rounded-xl border border-bl-line bg-white px-3 py-2 text-sm font-bold">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
                絞り込み{activeCount > 0 && <span className="rounded-full bg-bl-red px-1.5 text-[10px] font-bold text-white">{activeCount}</span>}
              </button>
              {SortBar}
            </div>
            <div className="mb-3 text-sm font-black"><span className="text-bl-red">{list.length}</span>件の求人</div>
            <div className="grid gap-4 sm:grid-cols-2">{list.length === 0 ? <p className="rounded-2xl border border-dashed border-bl-line bg-white p-10 text-center text-bl-gray2">求人が見つかりませんでした。</p> : list.map((j) => <Card key={j.id} job={j} saved={savedSet.has(j.id)} onToggleSave={() => toggleSave(j.id)} />)}</div>
          </div>
        </Shell>

        {drawer && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawer(false)} />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl bg-white p-5">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-black">絞り込み</h3><button onClick={() => setDrawer(false)} className="text-bl-gray2"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button></div>
              {Filters}
              <div className="mt-4 flex gap-2">
                <button onClick={() => setF(EMPTY)} className="flex-1 rounded-xl border border-bl-line py-3 text-sm font-bold text-bl-gray">リセット</button>
                <button onClick={() => setDrawer(false)} className="flex-1 rounded-xl bg-bl-red py-3 text-sm font-bold text-white">{list.length}件を見る</button>
              </div>
            </div>
          </>
        )}
      </div>

      <MessengerPopupButton />
    </>
  );
}
