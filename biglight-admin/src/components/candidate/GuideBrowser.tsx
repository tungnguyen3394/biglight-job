"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GUIDE_CATEGORIES, type GuideCard } from "@/lib/guide";

function fmtDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, "/");
}

function CardItem({ a }: { a: GuideCard }) {
  return (
    <Link href={`/guide/${a.slug}`} className="flex flex-col overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-bl-red hover:shadow-lg">
      <div className="relative h-40 overflow-hidden bg-bl-bg">
        {a.image
          ? <img src={a.image} alt="" className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center text-bl-gray2"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m3 16 5-5 4 4 3-3 6 6" /><circle cx="8.5" cy="8.5" r="1.5" /></svg></div>}
        {a.category && <span className="absolute left-2.5 top-2.5 rounded-full bg-bl-red px-2.5 py-0.5 text-[11px] font-bold text-white shadow">{a.category}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink">{a.title}</h3>
        {a.excerpt && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-bl-gray">{a.excerpt}</p>}
        <div className="mt-auto pt-2.5 text-[11px] text-bl-gray2">{fmtDate(a.date)}</div>
      </div>
    </Link>
  );
}

export default function GuideBrowser({ cards }: { cards: GuideCard[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return cards.filter((a) => {
      if (cat && a.category !== cat) return false;
      if (kw && !`${a.title} ${a.excerpt} ${a.category}`.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [cards, q, cat]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="text-center">
        <div className="text-xs font-black tracking-[0.2em] text-bl-red">GUIDE</div>
        <h1 className="mt-1 text-3xl font-black text-ink">特定技能ガイド</h1>
        <p className="mt-2 text-sm text-bl-gray">特定技能・ビザ・仕事・日本での生活など、働く人のための知識をまとめています。</p>
      </div>

      {/* Search */}
      <div className="relative mx-auto mt-6 max-w-xl">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-bl-gray2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="記事を検索（キーワード）" className="w-full rounded-full border border-bl-line bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-bl-red" />
      </div>

      {/* Category filter */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={() => setCat("")} className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${cat === "" ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray hover:border-bl-red"}`}>すべて</button>
        {GUIDE_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${cat === c ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray hover:border-bl-red"}`}>{c}</button>
        ))}
      </div>

      {/* List */}
      <div className="mt-7">
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bl-line bg-white p-12 text-center text-bl-gray2">該当する記事がありません。</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((a) => <CardItem key={a.id} a={a} />)}</div>
        )}
      </div>
    </div>
  );
}
