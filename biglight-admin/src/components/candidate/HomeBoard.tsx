"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Shell from "./Shell";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDARD_TAGS } from "@/lib/site";
import { RESIDENCE_LABEL } from "@/lib/constants";

export type PublicJob = {
  id: string;
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

export default function HomeBoard({ jobs, initialQ = "" }: { jobs: PublicJob[]; initialQ?: string }) {
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

  function toggleTag(t: string) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  return (
    <Shell active="jobs" searchValue={q} onSearchChange={setQ}>
      {/* Filter bar: 特定技能分野 + 地域, then TAG chips */}
      <div className="sticky top-[53px] z-20 border-b border-bl-line bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2">
            <select value={field} onChange={(e) => setField(e.target.value)} className="rounded-xl border border-bl-line bg-white px-3 py-2 text-sm font-semibold">
              <option value="">特定技能分野（すべて）</option>
              {fields.map((f) => <option key={f}>{f}</option>)}
            </select>
            <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded-xl border border-bl-line bg-white px-3 py-2 text-sm font-semibold">
              <option value="">地域（すべて）</option>
              {PREFECTURES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {(field || area || tags.length > 0) && (
              <button onClick={() => { setField(""); setArea(""); setTags([]); }} className="text-xs font-semibold text-bl-gray2 underline">
                条件をクリア
              </button>
            )}
          </div>
          {/* TAG chips */}
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {STANDARD_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${tags.includes(t) ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray hover:border-bl-red hover:text-bl-red"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-black"><span className="text-bl-red">{list.length}</span>件の求人</h1>
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bl-line bg-white p-12 text-center text-bl-gray2">条件に合う求人が見つかりませんでした。</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </Shell>
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
        {job.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {job.tags.slice(0, 3).map((t) => <span key={t} className="rounded bg-bl-bg px-1.5 py-0.5 text-[11px] text-bl-gray">#{t}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}
