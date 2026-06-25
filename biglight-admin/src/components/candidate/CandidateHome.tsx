"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Shell from "./Shell";
import FbChat from "./FbChat";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDARD_TAGS, TEAM, STORIES, COMPANY, HERO_IMAGE, FB_PAGE_URL } from "@/lib/site";
import { RESIDENCE_LABEL } from "@/lib/constants";

export type PublicJob = {
  id: string; title: string; company: string; industry: string; jobType: string | null;
  location: string; city: string | null; salaryLabel: string | null; japaneseLevel: string | null;
  residence: string; dormitory: boolean; recruitCount: number; tags: string[]; img: string;
};

const FbIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
);
const fbRegister = () => window.open(FB_PAGE_URL, "_blank", "noopener");

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
  const toggleTag = (t: string) => setTags((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]));

  const TagChips = (
    <div className="flex flex-wrap gap-1.5">
      {STANDARD_TAGS.map((t) => (
        <button key={t} onClick={() => toggleTag(t)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${tags.includes(t) ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray hover:border-bl-red hover:text-bl-red"}`}>{t}</button>
      ))}
    </div>
  );

  const Grid =
    list.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-bl-line bg-white p-12 text-center text-bl-gray2">条件に合う求人が見つかりませんでした。</p>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((j) => <JobCard key={j.id} job={j} />)}</div>
    );

  return (
    <>
      {/* ===================== DESKTOP (landing) ===================== */}
      <div className="hidden bg-white text-ink lg:block">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-bl-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bl-red text-lg font-black text-white">B</span>
              <span className="text-lg font-black">BIGLIGHT<span className="text-bl-red"> JOB</span></span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-semibold text-bl-gray">
              <a href="#jobs" className="hover:text-ink">求人を探す</a>
              <a href="#team" className="hover:text-ink">サポートチーム</a>
              <a href="#testi" className="hover:text-ink">体験談</a>
              <a href="#flow" className="hover:text-ink">応募の流れ</a>
              <Link href="/mypage" className="hover:text-ink">マイページ</Link>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={fbRegister} className="flex items-center gap-1.5 rounded-lg bg-bl-fb px-3 py-2 text-sm font-bold text-white hover:bg-[#0C63D4]"><FbIcon /> Facebookで登録</button>
              <Link href="/login" className="rounded-lg border border-bl-line px-3 py-2 text-sm font-semibold text-bl-gray hover:text-ink">管理</Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1a0a08]/92 via-[#2a0d0a]/88 to-[#13335C]/82" />
          <div className="mx-auto max-w-6xl px-6 py-20 text-white">
            <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/15 px-3 py-1">工業製品製造業</span>
              <span className="rounded-full bg-white/15 px-3 py-1">建設業</span>
              <span className="rounded-full bg-white/15 px-3 py-1">ほか 特定技能 全分野に対応</span>
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">日本で働く夢を、<br /><span className="text-[#FF6B61]">最短ルート</span>で叶える。</h1>
            <p className="mt-4 max-w-2xl text-white/80">特定技能の <b>製造・建設</b> を中心に、寮あり・ビザ支援つきの優良求人を多数掲載。手数料は完全無料です。</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
              <span>✓ 完全無料</span><span>✓ ビザ・書類サポート</span><span>✓ 寮あり多数</span><span>✓ 登録支援機関</span>
            </div>

            {/* Search box */}
            <div className="mt-8 rounded-2xl bg-white p-4 text-ink shadow-2xl">
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="キーワード（溶接、惣菜、足場 …）" className="rounded-xl bg-bl-bg px-4 py-3 text-sm outline-none" />
                <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded-xl border border-bl-line px-3 py-3 text-sm font-semibold">
                  <option value="">すべての地域</option>{PREFECTURES.map((p) => <option key={p}>{p}</option>)}
                </select>
                <select value={field} onChange={(e) => setField(e.target.value)} className="rounded-xl border border-bl-line px-3 py-3 text-sm font-semibold">
                  <option value="">特定技能分野（すべて）</option>{fields.map((f) => <option key={f}>{f}</option>)}
                </select>
                <a href="#jobs" className="flex items-center justify-center rounded-xl bg-bl-red px-6 py-3 text-sm font-bold text-white hover:bg-bl-redd">この条件で検索</a>
              </div>
              <div className="mt-3">{TagChips}</div>
            </div>
          </div>
        </section>

        {/* Jobs */}
        <section id="jobs" className="bg-bl-bg py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-2xl font-black"><span className="text-bl-red">{list.length}</span>件の求人</h2>
              {(field || area || tags.length > 0) && <button onClick={() => { setField(""); setArea(""); setTags([]); setQ(""); }} className="text-sm font-semibold text-bl-gray2 underline">条件をクリア</button>}
            </div>
            {Grid}
          </div>
        </section>

        {/* Why */}
        <section id="why" className="py-14">
          <div className="mx-auto max-w-6xl px-6">
            <SecHead ey="WHY BIGLIGHT" h2="BIGLIGHT が選ばれる理由" p="あなたの「日本で働きたい」を、最後まで責任を持ってサポートします。" />
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[["手数料 完全無料", "登録から入社まで、あなたが支払う費用は一切ありません。安心して相談できます。"], ["ビザ・書類をフルサポート", "登録支援機関として、在留資格の申請や書類作成をワンストップで代行します。"], ["入社後も寄り添う", "最長1年の安心サポート。日本での生活や仕事の悩みも気軽に相談できます。"]].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-bl-line bg-white p-6 shadow-sm"><h3 className="text-lg font-bold text-bl-red">{t}</h3><p className="mt-2 text-sm leading-relaxed text-bl-gray">{d}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section id="team" className="bg-bl-bg py-14">
          <div className="mx-auto max-w-6xl px-6">
            <SecHead ey="SUPPORT TEAM" h2="あなたの専属サポーター" p="登録から入社後まで、母国語で寄り添うBIGLIGHTの相談員チームです。" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((m) => (
                <div key={m.name} className="overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm">
                  <div className="relative h-44"><img src={m.img} alt="" className="h-full w-full object-cover" /><span className="absolute right-2 top-2 rounded-full bg-bl-green px-2 py-0.5 text-[11px] font-bold text-white">対応可能</span></div>
                  <div className="p-4">
                    <h3 className="font-bold">{m.name}</h3>
                    <div className="text-xs text-bl-gray2">{m.rom}</div>
                    <div className="mt-1 text-sm font-semibold text-bl-red">{m.role}</div>
                    <div className="mt-2 flex flex-wrap gap-1">{m.langs.map((l) => <span key={l} className="rounded bg-bl-bg px-2 py-0.5 text-[11px] text-bl-gray">{l}</span>)}</div>
                    <button onClick={fbRegister} className="mt-3 w-full rounded-lg border border-bl-line py-2 text-sm font-semibold text-bl-gray hover:border-bl-red hover:text-bl-red">相談する</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testi" className="py-14">
          <div className="mx-auto max-w-6xl px-6">
            <SecHead ey="SUCCESS STORIES" h2="先輩たちの声" />
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {STORIES.map((s) => (
                <div key={s.name} className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3"><img src={s.img} alt="" className="h-11 w-11 rounded-full object-cover" /><div><b className="text-sm">{s.name}</b><div className="text-xs text-bl-gray2">{s.meta}</div></div></div>
                  <div className="mt-2 text-bl-amber">★★★★★</div>
                  <p className="mt-2 text-sm leading-relaxed text-bl-gray">「{s.quote}」</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Flow */}
        <section id="flow" className="bg-bl-bg py-14">
          <div className="mx-auto max-w-6xl px-6">
            <SecHead ey="HOW IT WORKS" h2="応募はかんたん5ステップ" />
            <div className="mt-8 grid gap-4 sm:grid-cols-5">
              {[["1", "無料登録", "Facebookで30秒"], ["2", "無料相談", "希望をヒアリング"], ["3", "求人紹介", "条件に合う求人を提案"], ["4", "面接", "オンライン可・準備サポート"], ["5", "入社", "ビザ・渡航までサポート"]].map(([n, t, d]) => (
                <div key={n} className="rounded-2xl border border-bl-line bg-white p-5 text-center shadow-sm"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-bl-red font-black text-white">{n}</div><h4 className="mt-3 text-sm font-bold">{t}</h4><p className="mt-1 text-xs text-bl-gray">{d}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-bl-red to-bl-redd py-16 text-center text-white">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-3xl font-black">まずは無料で登録しよう</h2>
            <p className="mt-3 text-white/85">Facebookアカウントですぐに始められます。担当者がチャットでサポートします。</p>
            <button onClick={fbRegister} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-bl-fb px-7 py-3.5 text-base font-bold text-white shadow-lg hover:bg-[#0C63D4]"><FbIcon size={20} /> Facebookで無料登録</button>
            <div className="mt-3 text-xs text-white/75">※ 登録・相談・入社まで完全無料 / 個人情報は厳重に管理します</div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#16181D] py-12 text-sm text-white/70">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bl-red font-black text-white">B</span><span className="font-black text-white">BIGLIGHT<span className="text-bl-red"> JOB</span></span></div>
              <p className="mt-3 leading-relaxed">{COMPANY.name}<br />{COMPANY.postal} {COMPANY.address}<br />TEL: {COMPANY.tel}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{COMPANY.licenses.map((l) => <span key={l} className="rounded bg-white/10 px-2 py-0.5 text-[11px]">{l}</span>)}</div>
            </div>
            <div><h5 className="mb-2 font-bold text-white">分野から探す</h5><div className="flex flex-col gap-1"><a href="#jobs" className="hover:text-white">工業製品製造業</a><a href="#jobs" className="hover:text-white">建設業</a><a href="#jobs" className="hover:text-white">飲食料品製造業</a><a href="#jobs" className="hover:text-white">外食業・介護・宿泊 ほか</a></div></div>
            <div><h5 className="mb-2 font-bold text-white">BIGLIGHTについて</h5><div className="flex flex-col gap-1"><a href="#why" className="hover:text-white">選ばれる理由</a><a href="#flow" className="hover:text-white">応募の流れ</a><a href="#testi" className="hover:text-white">体験談</a></div></div>
          </div>
          <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 px-6 pt-5 text-xs text-white/50">© 2026 {COMPANY.name} — 日本の成長を、もっとグローバルに</div>
        </footer>
      </div>

      {/* ===================== MOBILE (app-shell) ===================== */}
      <div className="lg:hidden">
        <Shell active="jobs" searchValue={q} onSearchChange={setQ}>
          <div className="sticky top-[53px] z-20 border-b border-bl-line bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <select value={field} onChange={(e) => setField(e.target.value)} className="rounded-xl border border-bl-line bg-white px-3 py-2 text-sm font-semibold"><option value="">特定技能分野</option>{fields.map((f) => <option key={f}>{f}</option>)}</select>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded-xl border border-bl-line bg-white px-3 py-2 text-sm font-semibold"><option value="">地域</option>{PREFECTURES.map((p) => <option key={p}>{p}</option>)}</select>
              {(field || area || tags.length > 0) && <button onClick={() => { setField(""); setArea(""); setTags([]); }} className="text-xs font-semibold text-bl-gray2 underline">クリア</button>}
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {STANDARD_TAGS.map((t) => <button key={t} onClick={() => toggleTag(t)} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${tags.includes(t) ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray"}`}>{t}</button>)}
            </div>
          </div>
          <div className="px-4 py-5">
            <h1 className="mb-4 text-xl font-black"><span className="text-bl-red">{list.length}</span>件の求人</h1>
            {Grid}
          </div>
        </Shell>
      </div>

      <FbChat />
    </>
  );
}

function SecHead({ ey, h2, p }: { ey: string; h2: string; p?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-black tracking-widest text-bl-red">{ey}</div>
      <h2 className="mt-1 text-2xl font-black">{h2}</h2>
      {p && <p className="mx-auto mt-2 max-w-xl text-sm text-bl-gray">{p}</p>}
    </div>
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
