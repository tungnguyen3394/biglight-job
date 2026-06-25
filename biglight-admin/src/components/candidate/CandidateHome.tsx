"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Shell from "./Shell";
import FbChat from "./FbChat";
import HeroArt from "./HeroArt";
import Logo from "./Logo";
import MultiSelect from "./MultiSelect";
import SiteFooter from "./SiteFooter";
import LangSwitch from "./LangSwitch";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDARD_TAGS, FB_PAGE_URL } from "@/lib/site";
import { RESIDENCE_LABEL } from "@/lib/constants";

export type PublicJob = {
  id: string; title: string; company: string; industry: string; jobType: string | null;
  location: string; city: string | null; salaryLabel: string | null; japaneseLevel: string | null;
  residence: string; dormitory: boolean; recruitCount: number; tags: string[]; img: string;
};

const FbIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
);

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

export default function CandidateHome({ jobs, initialQ = "" }: { jobs: PublicJob[]; initialQ?: string }) {
  const [q, setQ] = useState(initialQ);
  const [field, setField] = useState("");
  const [area, setArea] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const fields = useMemo(() => Array.from(new Set(jobs.map((j) => j.industry))).sort(), [jobs]);
  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (field && j.industry !== field) return false;
      if (area && j.location !== area) return false;
      if (tags.length && !tags.every((t) => j.tags.includes(t))) return false;
      if (kw) {
        const hay = `${j.title} ${j.company} ${j.location} ${j.city ?? ""} ${j.jobType ?? ""} ${j.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [jobs, q, field, area, tags]);

  const Grid = list.length === 0 ? (
    <p className="rounded-2xl border border-dashed border-bl-line bg-white p-12 text-center text-bl-gray2">条件に合う求人が見つかりませんでした。</p>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((j) => <JobCard key={j.id} job={j} />)}</div>
  );

  const searchProps = { area, setArea, field, setField, fields, tags, setTags };

  return (
    <>
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden bg-white text-ink lg:block">
        <header className="sticky top-0 z-30 border-b border-bl-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" className="flex items-center gap-2"><Logo size={36} /><span className="text-lg font-black">BIGLIGHT<span className="text-bl-red"> JOB</span></span></Link>
            <nav className="flex items-center gap-5 text-sm font-bold text-bl-gray">
              <Link href="/" className="text-ink">求人を探す</Link>
              <Link href="/about" className="hover:text-ink">私たちについて</Link>
              <Link href="/info" className="hover:text-ink">役に立つ情報</Link>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <LangSwitch />
              <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-bl-fb px-3 py-2 text-sm font-bold text-white hover:bg-[#0C63D4]"><FbIcon /> 登録</a>
              <Link href="/mypage" className="rounded-lg bg-bl-red px-4 py-2 text-sm font-black text-white shadow-md hover:bg-bl-redd">マイページ</Link>
            </div>
          </div>
        </header>

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

        {/* Jobs */}
        <section id="jobs" className="bg-bl-bg py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-2xl font-black"><span className="text-bl-red">{list.length}</span>件の特定技能求人</h2>
              {(field || area || tags.length > 0) && <button onClick={() => { setField(""); setArea(""); setTags([]); }} className="text-sm font-semibold text-bl-gray2 underline">条件をクリア</button>}
            </div>
            {Grid}
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
          <div className="px-4 py-5">
            <h2 className="mb-4 text-lg font-black"><span className="text-bl-red">{list.length}</span>件の求人</h2>
            {Grid}
          </div>
        </Shell>
      </div>

      <FbChat />
    </>
  );
}

function JobCard({ job }: { job: PublicJob }) {
  const chip = job.industry.includes("製造") ? "bg-bl-bluesoft text-bl-blue" : job.industry.includes("建設") ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-greensoft text-bl-green";
  return (
    <Link href={`/jobs/${job.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-bl-red hover:shadow-lg">
      <div className="relative h-32 overflow-hidden">
        <img src={job.img} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip}`}>{job.industry}</span>
          {job.dormitory && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-bl-green">寮あり</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold leading-snug group-hover:text-bl-red">{job.title}</h3>
        <p className="mt-0.5 text-xs text-bl-gray">{job.company}</p>
        <div className="mt-2.5 grid grid-cols-2 gap-y-1 border-t border-dashed border-bl-line pt-2.5 text-xs text-bl-gray">
          {job.salaryLabel && <div className="col-span-2 font-bold text-bl-red">💴 {job.salaryLabel}</div>}
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
