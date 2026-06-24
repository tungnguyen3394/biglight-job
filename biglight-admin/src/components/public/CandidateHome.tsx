"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FB_PAGE_URL, HERO_IMAGE } from "@/lib/site";
import { RESIDENCE_LABEL } from "@/lib/constants";

export type PublicJob = {
  id: string;
  code: string;
  title: string;
  company: string;
  industry: string;
  jobType: string | null;
  location: string;
  city: string | null;
  salaryLabel: string | null;
  japaneseLevel: string | null;
  residence: string;
  dormitory: boolean;
  recruitCount: number;
  tags: string[];
  img: string;
};

const FbIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
  </svg>
);

function fbRegister() {
  window.open(FB_PAGE_URL, "_blank", "noopener");
}

export default function CandidateHome({ jobs }: { jobs: PublicJob[] }) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [field, setField] = useState("");

  const areas = useMemo(() => Array.from(new Set(jobs.map((j) => j.location))).sort(), [jobs]);
  const fields = useMemo(() => Array.from(new Set(jobs.map((j) => j.industry))).sort(), [jobs]);

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (area && j.location !== area) return false;
      if (field && j.industry !== field) return false;
      if (kw) {
        const hay = `${j.title} ${j.company} ${j.location} ${j.city ?? ""} ${j.jobType ?? ""} ${j.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [jobs, q, area, field]);

  return (
    <div className="min-h-screen bg-bl-bg text-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-bl-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bl-red text-lg font-black text-white">B</span>
            <span className="text-lg font-black">
              BIGLIGHT<span className="text-bl-red"> JOB</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm font-semibold text-bl-gray sm:gap-4">
            <a href="#jobs" className="hidden hover:text-ink sm:inline">求人一覧</a>
            <Link href="/mypage" className="hidden hover:text-ink sm:inline">マイページ</Link>
            <Link href="/login" className="hidden text-bl-gray2 hover:text-ink sm:inline">管理ログイン</Link>
            <button onClick={fbRegister} className="flex items-center gap-1.5 rounded-lg bg-bl-fb px-3 py-2 text-white">
              <FbIcon /> Facebookで登録
            </button>
          </nav>
        </div>
      </header>

      {/* Hero with cover image */}
      <section className="relative isolate overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1a0a08]/90 via-[#2a0d0a]/85 to-[#13335C]/80" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-white">
          <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            特定技能・育成就労の<span className="text-[#FF6B61]">優良求人</span>を、<br className="hidden sm:block" />
            あなたに。
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/80 sm:text-base">
            BIGLIGHTが厳選した、外国人材向けの求人。寮あり・未経験OK・ビザサポート無料。
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
            <span>✓ 手数料 完全無料</span>
            <span>✓ ビザ・書類サポート</span>
            <span>✓ 入社後もフォロー</span>
            <span>✓ 日本語・ベトナム語対応</span>
          </div>

          {/* Search box */}
          <div className="mt-8 rounded-2xl bg-white p-3 shadow-2xl sm:p-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="キーワード（溶接、惣菜、足場 …）"
                className="rounded-xl bg-bl-bg px-4 py-3 text-sm text-ink outline-none"
              />
              <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded-xl border border-bl-line bg-white px-3 py-3 text-sm font-semibold text-ink">
                <option value="">すべての地域</option>
                {areas.map((a) => <option key={a}>{a}</option>)}
              </select>
              <select value={field} onChange={(e) => setField(e.target.value)} className="rounded-xl border border-bl-line bg-white px-3 py-3 text-sm font-semibold text-ink">
                <option value="">すべての分野</option>
                {fields.map((f) => <option key={f}>{f}</option>)}
              </select>
              <a href="#jobs" className="flex items-center justify-center rounded-xl bg-bl-red px-6 py-3 text-sm font-bold text-white hover:bg-bl-redd">
                検索する
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Job results */}
      <main id="jobs" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-2xl font-black">公開中の求人</h2>
          <span className="text-sm text-bl-gray">{list.length}件</span>
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bl-line bg-white p-12 text-center text-bl-gray2">
            条件に合う求人が見つかりませんでした。
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </main>

      {/* Why BIGLIGHT */}
      <section className="border-t border-bl-line bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black">なぜ BIGLIGHT なのか</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              ["完全無料", "求職者の手数料は一切ありません。安心してご相談ください。"],
              ["ビザ・書類サポート", "在留資格の変更、書類準備、面接まで専門スタッフが伴走します。"],
              ["入社後もフォロー", "就職後の生活・トラブルもベトナム語/日本語でサポート。"],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-bl-line bg-bl-bg p-6">
                <h3 className="text-lg font-bold text-bl-red">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bl-gray">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-step flow */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black">応募から入社までの流れ</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-5">
            {[
              ["1", "登録", "Facebookで無料登録"],
              ["2", "書類選考", "希望に合う求人をご紹介"],
              ["3", "面接", "日程調整・面接サポート"],
              ["4", "内定", "条件確認・契約手続き"],
              ["5", "入社", "ビザ・引越し・入社後フォロー"],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl border border-bl-line bg-white p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-bl-red font-black text-white">{n}</div>
                <h3 className="mt-3 text-sm font-bold">{t}</h3>
                <p className="mt-1 text-xs leading-relaxed text-bl-gray">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-bl-red to-bl-redd py-14 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl font-black sm:text-3xl">まずは Facebook で無料登録</h2>
          <p className="mt-3 text-sm text-white/85">登録後、担当者があなたに合う求人をご紹介します。手数料は一切かかりません。</p>
          <button onClick={fbRegister} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-bl-fb px-7 py-3.5 text-base font-bold text-white shadow-lg hover:bg-[#0C63D4]">
            <FbIcon size={20} /> Facebookで無料登録
          </button>
        </div>
      </section>

      <footer className="border-t border-bl-line bg-white py-8 text-center text-xs text-bl-gray2">
        © {new Date().getFullYear()} BIGLIGHT Job — 特定技能・育成就労 求人サイト
      </footer>
    </div>
  );
}

function JobCard({ job }: { job: PublicJob }) {
  const fieldChip = job.industry.includes("製造")
    ? "bg-bl-bluesoft text-bl-blue"
    : job.industry.includes("建設")
    ? "bg-bl-ambersoft text-bl-amber"
    : "bg-bl-greensoft text-bl-green";

  return (
    <Link href={`/jobs/${job.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-bl-red hover:shadow-lg">
      <div className="relative h-36 overflow-hidden">
        <img src={job.img} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${fieldChip}`}>{job.industry}</span>
          {job.dormitory && <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-bl-green">寮あり</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold leading-snug group-hover:text-bl-red">{job.title}</h3>
        <p className="mt-1 text-xs text-bl-gray">{job.company}</p>

        <div className="mt-3 grid grid-cols-2 gap-y-1.5 border-t border-dashed border-bl-line pt-3 text-xs text-bl-gray">
          {job.salaryLabel && (
            <div className="col-span-2 font-bold text-bl-red">💴 {job.salaryLabel}</div>
          )}
          <div>📍 {job.location}{job.city ? ` ${job.city}` : ""}</div>
          <div>🗾 {RESIDENCE_LABEL[job.residence] ?? job.residence}</div>
          {job.japaneseLevel && <div>日本語 {job.japaneseLevel}</div>}
          <div>募集 {job.recruitCount}名</div>
        </div>

        {job.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded bg-bl-bg px-2 py-0.5 text-xs text-bl-gray">#{t}</span>
            ))}
          </div>
        )}
        <span className="mt-4 text-sm font-bold text-bl-red">詳細を見る →</span>
      </div>
    </Link>
  );
}
