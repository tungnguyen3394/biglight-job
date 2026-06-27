"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "./Shell";
import FbChat from "./FbChat";
import HeroArt from "./HeroArt";
import MultiSelect from "./MultiSelect";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDARD_TAGS } from "@/lib/site";
import { RESIDENCE_LABEL } from "@/lib/constants";

export type PublicJob = {
  id: string; title: string; industry: string; jobType: string | null;
  location: string; city: string | null; salaryMain: string | null; monthlyExample: string | null; japaneseLevel: string | null;
  residence: string; dormitory: boolean; nightShift: boolean; recruitCount: number; tags: string[]; img: string;
};

// SVG line icon nhỏ (không dùng emoji)
function Ico({ d, size = 14 }: { d: React.ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">{d}</svg>;
}
const I_PIN = <><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>;
const I_YEN = <><path d="M12 4l5 7M12 4 7 11M12 11v9M8 13h8M8 16.5h8" /></>;
const I_STAR = <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17.3 5.8 20.8l1.6-6.7L2.2 8.9l6.9-.6z" />;
const I_MOON = <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;

function FeaturedCard({ job, loggedIn }: { job: PublicJob; loggedIn?: boolean }) {
  const chip = job.industry.includes("製造") ? "bg-bl-bluesoft text-bl-blue" : job.industry.includes("建設") ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-greensoft text-bl-green";
  const applyHref = `/mypage?apply=${encodeURIComponent(job.id)}&t=${encodeURIComponent(job.title)}`;
  void loggedIn;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-bl-red hover:shadow-lg">
      <Link href={`/jobs/${job.id}`} className="relative block h-32 overflow-hidden">
        <img src={job.img} alt="" className="h-full w-full object-cover" />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-bl-red px-2 py-0.5 text-[11px] font-black text-white shadow"><span className="text-amber-300"><Ico d={I_STAR} size={11} /></span>おすすめ</span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip}`}>{job.industry}</span>
          <span className="rounded-full bg-bl-redsoft px-2 py-0.5 text-[11px] font-bold text-bl-red">{RESIDENCE_LABEL[job.residence] ?? "特定技能"}</span>
        </div>
        <Link href={`/jobs/${job.id}`} className="line-clamp-2 text-[15px] font-bold leading-snug hover:text-bl-red">{job.title}</Link>
        {job.salaryMain && <div className="mt-1.5 flex items-center gap-1 text-sm font-black text-bl-red"><Ico d={I_YEN} />{job.salaryMain}</div>}
        <div className="mt-1 flex items-center gap-1 text-xs text-bl-gray"><Ico d={I_PIN} />{job.location}{job.city ? ` ${job.city}` : ""}{job.jobType ? `・${job.jobType}` : ""}</div>
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

function FeaturedSection({ featured, loggedIn }: { featured: PublicJob[]; loggedIn?: boolean }) {
  if (featured.length === 0) return null;
  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="text-bl-red"><Ico d={I_STAR} size={20} /></span>
          <h2 className="text-xl font-black sm:text-2xl">おすすめ求人</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((j) => <FeaturedCard key={j.id} job={j} loggedIn={loggedIn} />)}
        </div>
      </div>
    </section>
  );
}

const STEPS: [string, string, string][] = [
  ["1", "無料登録", "Facebookで30秒"],
  ["2", "無料相談", "希望をヒアリング"],
  ["3", "求人紹介", "条件に合う仕事を提案"],
  ["4", "面接", "オンライン可・準備サポート"],
  ["5", "入社", "ビザ・渡航までサポート"],
];

function FiveSteps() {
  return (
    <div className="rounded-2xl bg-white/85 p-4 shadow-lg backdrop-blur">
      <p className="mb-3 text-center text-sm font-black text-bl-red">応募はかんたん5ステップ</p>
      <div className="flex items-start justify-between gap-1">
        {STEPS.map(([n, t, d], i) => (
          <div key={n} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bl-red text-sm font-black text-white">{n}</div>
              <div className="mt-1 text-xs font-bold">{t}</div>
              <div className="mt-0.5 hidden text-[11px] leading-tight text-bl-gray sm:block">{d}</div>
            </div>
            {i < STEPS.length - 1 && <div className="mt-4 h-0.5 flex-1 bg-bl-redsoft" />}
          </div>
        ))}
      </div>
    </div>
  );
}

const selectCls = "w-full rounded-xl border border-bl-line bg-white px-3 py-3 text-sm font-semibold text-ink";

function SearchBox({ area, setArea, field, setField, fields, tags, setTags }: {
  area: string; setArea: (v: string) => void; field: string; setField: (v: string) => void;
  fields: string[]; tags: string[]; setTags: (v: string[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-xl">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <select value={area} onChange={(e) => setArea(e.target.value)} className={selectCls}>
          <option value="">すべての地域</option>
          {PREFECTURES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={field} onChange={(e) => setField(e.target.value)} className={selectCls}>
          <option value="">特定技能分野（すべて）</option>
          {fields.map((f) => <option key={f}>{f}</option>)}
        </select>
        <MultiSelect label="タグ" options={STANDARD_TAGS} value={tags} onChange={setTags} />
        <a href="#jobs" className="flex items-center justify-center rounded-xl bg-bl-red px-6 py-3 text-sm font-bold text-white hover:bg-bl-redd">検索する</a>
      </div>
    </div>
  );
}

export default function CandidateHome({ jobs, initialQ = "", loggedIn, savedIds = [], featured = [] }: { jobs: PublicJob[]; initialQ?: string; loggedIn?: boolean; savedIds?: string[]; featured?: PublicJob[] }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [field, setField] = useState("");
  const [area, setArea] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [savedSet, setSavedSet] = useState<Set<string>>(() => new Set(savedIds));

  function toggleSave(id: string) {
    if (!loggedIn) { router.push("/mypage"); return; }
    setSavedSet((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    fetch("/api/candidate/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
  }

  const fields = useMemo(() => Array.from(new Set(jobs.map((j) => j.industry))).sort(), [jobs]);
  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (field && j.industry !== field) return false;
      if (area && j.location !== area) return false;
      if (tags.length && !tags.every((t) => j.tags.includes(t))) return false;
      if (kw) {
        const hay = `${j.title} ${j.location} ${j.city ?? ""} ${j.jobType ?? ""} ${j.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [jobs, q, field, area, tags]);

  const Grid = list.length === 0 ? (
    <p className="rounded-2xl border border-dashed border-bl-line bg-white p-12 text-center text-bl-gray2">条件に合う求人が見つかりませんでした。</p>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((j) => <JobCard key={j.id} job={j} saved={savedSet.has(j.id)} onToggleSave={() => toggleSave(j.id)} />)}</div>
  );
  const Body = list.length === 0 ? Grid : view === "list" ? <JobList jobs={list} /> : Grid;

  const Toggle = (
    <div className="flex overflow-hidden rounded-lg border border-bl-line">
      <button onClick={() => setView("grid")} className={`flex h-8 w-9 items-center justify-center ${view === "grid" ? "bg-bl-red text-white" : "bg-white text-bl-gray hover:bg-bl-bg"}`} aria-label="カード表示">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg>
      </button>
      <button onClick={() => setView("list")} className={`flex h-8 w-9 items-center justify-center border-l border-bl-line ${view === "list" ? "bg-bl-red text-white" : "bg-white text-bl-gray hover:bg-bl-bg"}`} aria-label="リスト表示">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
      </button>
    </div>
  );

  const searchProps = { area, setArea, field, setField, fields, tags, setTags };

  return (
    <>
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden bg-white text-ink lg:block">
        <SiteHeader active="jobs" loggedIn={loggedIn} />

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF6F2] via-[#FFE7DF] to-[#FFD9CC]">
          <div className="mx-auto max-w-6xl px-6 pb-10 pt-12">
            <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-black text-bl-red shadow-sm">🎌 特定技能 全16分野に対応</span>
                <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">特定技能の求人を、<br /><span className="text-bl-red">サクッと</span>見つけよう。</h1>
                <p className="mt-3 text-lg font-bold text-bl-gray">あなたにピッタリの仕事が、きっと見つかる。✨</p>
              </div>
              <div><HeroArt className="mx-auto w-full max-w-md" /></div>
            </div>

            {/* 5 steps ABOVE search */}
            <div className="mx-auto mt-8 max-w-4xl"><FiveSteps /></div>
            {/* Search */}
            <div className="mx-auto mt-4 max-w-4xl"><SearchBox {...searchProps} /></div>
          </div>
        </section>

        {/* おすすめ求人 */}
        <FeaturedSection featured={featured} loggedIn={loggedIn} />

        {/* Jobs */}
        <section id="jobs" className="bg-bl-bg py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black"><span className="text-bl-red">{list.length}</span>件の特定技能求人</h2>
              <div className="flex items-center gap-3">
                {(field || area || tags.length > 0) && <button onClick={() => { setField(""); setArea(""); setTags([]); }} className="text-sm font-semibold text-bl-gray2 underline">条件をクリア</button>}
                {Toggle}
              </div>
            </div>
            {Body}
          </div>
        </section>

        <SiteFooter />
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className="lg:hidden">
        <Shell active="jobs" searchValue={q} onSearchChange={setQ}>
          <div className="bg-gradient-to-br from-[#FFF6F2] to-[#FFD9CC] px-4 pb-3 pt-4">
            <h1 className="text-xl font-black leading-snug text-ink">特定技能の求人を、<span className="text-bl-red">サクッと</span>見つけよう 🎌</h1>
            <div className="mt-3"><FiveSteps /></div>
            <div className="mt-3"><SearchBox {...searchProps} /></div>
          </div>
          <FeaturedSection featured={featured} loggedIn={loggedIn} />
          <div className="px-4 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black"><span className="text-bl-red">{list.length}</span>件の求人</h2>
              {Toggle}
            </div>
            {Body}
          </div>
        </Shell>
      </div>

      <FbChat />
    </>
  );
}

function JobCard({ job, saved, onToggleSave }: { job: PublicJob; saved: boolean; onToggleSave: () => void }) {
  const chip = job.industry.includes("製造") ? "bg-bl-bluesoft text-bl-blue" : job.industry.includes("建設") ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-greensoft text-bl-green";
  return (
    <Link href={`/jobs/${job.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-bl-red hover:shadow-lg">
      <div className="relative h-32 overflow-hidden">
        <img src={job.img} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip}`}>{job.industry}</span>
          {job.dormitory && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-bl-green">寮あり</span>}
        </div>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg leading-none shadow hover:bg-white" aria-label="お気に入り">
          <span className={saved ? "text-bl-red" : "text-bl-gray2"}>{saved ? "♥" : "♡"}</span>
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold leading-snug group-hover:text-bl-red">{job.title}</h3>
        <div className="mt-2.5 grid grid-cols-2 gap-y-1 border-t border-dashed border-bl-line pt-2.5 text-xs text-bl-gray">
          {job.salaryMain && <div className="col-span-2 font-bold text-bl-red">💴 {job.salaryMain}</div>}
          {job.monthlyExample && <div className="col-span-2 text-bl-gray">{job.monthlyExample}</div>}
          <div>📍 {job.location}{job.city ? ` ${job.city}` : ""}</div>
          <div>{RESIDENCE_LABEL[job.residence] ?? job.residence}</div>
          {job.japaneseLevel && <div>日本語 {job.japaneseLevel}</div>}
          <div>募集 {job.recruitCount}名</div>
        </div>
        {job.tags.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1">{job.tags.slice(0, 3).map((t) => <span key={t} className="rounded bg-bl-bg px-1.5 py-0.5 text-[11px] text-bl-gray">#{t}</span>)}</div>}
      </div>
    </Link>
  );
}

const COLS = "sm:grid sm:grid-cols-[120px_1fr_140px_1.4fr_72px] sm:items-center sm:gap-3";

function JobList({ jobs }: { jobs: PublicJob[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-bl-line bg-white">
      {/* Header (desktop) — 業種 / 勤務地 / 給与 / 職種 / 募集人数 */}
      <div className={`hidden border-b border-bl-line bg-bl-bg px-4 py-2.5 text-xs font-black text-bl-gray ${COLS}`}>
        <div>業種</div><div>勤務地</div><div>給与</div><div>職種（タイトル）</div><div>募集人数</div>
      </div>
      <div className="divide-y divide-bl-line">
        {jobs.map((j) => (
          <Link key={j.id} href={`/jobs/${j.id}`} className={`block px-4 py-3 transition hover:bg-bl-bg ${COLS}`}>
            <div className="mb-1.5 sm:mb-0"><span className="rounded-full bg-bl-bluesoft px-2 py-0.5 text-[11px] font-bold text-bl-blue">{j.industry}</span></div>
            <div className="text-sm text-bl-gray">📍 {j.location}{j.city ? ` ${j.city}` : ""}</div>
            <div className="text-sm font-bold text-bl-red">{j.salaryMain ?? "—"}</div>
            <div className="text-sm font-bold text-ink">{j.title}</div>
            <div className="text-sm text-bl-gray">募集 {j.recruitCount}名</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
