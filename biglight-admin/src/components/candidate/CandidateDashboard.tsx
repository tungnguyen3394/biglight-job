"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CandidateProfileForm, { type ProfileInit } from "./CandidateProfileForm";
import CandidateDocuments, { type DocMap } from "./CandidateDocuments";

const STAGES = ["応募", "面談", "面接", "内定", "ビザ申請中", "入社"];

export type AppView = { id: string; code: string; title: string; company: string; stage: number; statusLabel: string; ended: boolean };
export type SavedJob = { id: string; title: string; industry: string; location: string; city: string | null; salaryMain: string | null };

type SecKey = "apps" | "profile" | "docs" | "saved" | "messages" | "settings";
const ITEMS: { key: SecKey; label: string; icon: string }[] = [
  { key: "apps", label: "応募状況・進捗", icon: "📊" },
  { key: "profile", label: "プロフィール入力", icon: "📝" },
  { key: "docs", label: "提出書類", icon: "📄" },
  { key: "saved", label: "お気に入り求人", icon: "♡" },
  { key: "messages", label: "メッセージ", icon: "💬" },
  { key: "settings", label: "アカウント設定", icon: "⚙️" },
];

const INBOX = [
  { from: "BIGLIGHT サポート", time: "10分前", text: "プロフィールを完成させると、マッチングする求人が増えます。", unread: true, color: "#D02E26" },
  { from: "担当アドバイザー", time: "1時間前", text: "ご希望の面接日をお知らせください。日本語・ベトナム語どちらでもOKです。", unread: true, color: "#2563EB" },
];

function Tracker({ stage }: { stage: number }) {
  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {STAGES.map((label, i) => {
        const done = i < stage, cur = i === stage;
        return (
          <div key={label} className="flex flex-1 items-start" style={{ minWidth: 64 }}>
            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-black ${done ? "border-bl-green bg-bl-green text-white" : cur ? "border-bl-red bg-bl-red text-white shadow-[0_0_0_4px_#FDECEA]" : "border-bl-line bg-bl-bg text-bl-gray2"}`}>{done ? "✓" : i + 1}</div>
              <div className={`text-[11px] font-semibold ${done ? "text-ink" : cur ? "font-black text-bl-red" : "text-bl-gray2"}`}>{label}</div>
            </div>
            {i < STAGES.length - 1 && <div className={`mt-[18px] h-[3px] flex-1 rounded ${done ? "bg-bl-green" : "bg-bl-line"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function CandidateDashboard({ name, apps, applied, profile, docs, saved: savedInit }: { name: string; apps: AppView[]; applied?: boolean; profile: ProfileInit; docs: DocMap; saved: SavedJob[] }) {
  const router = useRouter();
  const [sec, setSec] = useState<SecKey>(applied ? "apps" : "apps");
  const [saved, setSaved] = useState<SavedJob[]>(savedInit);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }
  async function unsave(id: string) {
    setSaved((s) => s.filter((j) => j.id !== id));
    await fetch("/api/candidate/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
  }

  const heading = ITEMS.find((i) => i.key === sec)?.label ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Welcome */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">ようこそ、{name} さん 👋</h1>
          <p className="text-sm text-bl-gray">応募状況の確認・担当者との連絡ができます。</p>
        </div>
      </div>

      {applied && <div className="mb-5 rounded-2xl border border-bl-green bg-bl-greensoft p-4 text-sm font-semibold text-bl-green">✓ 応募を受け付けました。担当者がご連絡します。</div>}

      <div className="lg:grid lg:grid-cols-[230px_1fr] lg:items-start lg:gap-6">
        {/* Sidebar — desktop */}
        <aside className="mb-4 lg:sticky lg:top-20 lg:mb-0">
          {/* Mobile: horizontal tabs */}
          <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
            {ITEMS.map((it) => (
              <button key={it.key} onClick={() => setSec(it.key)} className={`flex-none whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold ${sec === it.key ? "bg-bl-red text-white" : "bg-white text-bl-gray"}`}>{it.icon} {it.label}</button>
            ))}
          </nav>
          {/* Desktop: vertical list */}
          <nav className="hidden rounded-2xl border border-bl-line bg-white p-2 lg:block">
            {ITEMS.map((it) => (
              <button key={it.key} onClick={() => setSec(it.key)} className={`mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${sec === it.key ? "bg-bl-redsoft text-bl-red" : "text-bl-gray hover:bg-bl-bg hover:text-ink"}`}>
                <span className="w-5 text-center">{it.icon}</span>{it.label}
              </button>
            ))}
            <a href="/biglight-job-salary.html" target="_blank" rel="noopener noreferrer" className="mt-1 flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-br from-bl-red to-bl-redd px-3 py-2.5 text-left text-sm font-bold text-white">
              <span className="w-5 text-center">💰</span>手取り計算ツール
            </a>
            <button onClick={logout} className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-bl-gray2 hover:bg-bl-bg hover:text-bl-red">
              <span className="w-5 text-center">↩</span>ログアウト
            </button>
          </nav>
          {/* Mobile salary button */}
          <a href="/biglight-job-salary.html" target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-between rounded-2xl bg-gradient-to-br from-bl-red to-bl-redd p-4 text-white lg:hidden">
            <span className="text-sm font-black">💰 手取り計算ツール</span><span className="text-sm font-bold">計算する →</span>
          </a>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          <h2 className="mb-3 hidden text-lg font-black lg:block">{heading}</h2>

          {sec === "apps" && (
            apps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-bl-line bg-white p-10 text-center text-bl-gray2">まだ応募はありません。<Link href="/" className="mt-2 block font-semibold text-bl-red">求人を探す →</Link></div>
            ) : (
              <div className="space-y-4">
                {apps.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-bl-bg px-2 py-0.5 text-xs font-bold text-bl-gray">{a.code}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${a.ended ? "bg-bl-line text-bl-gray" : "bg-bl-redsoft text-bl-red"}`}>{a.statusLabel}</span>
                      <h3 className="ml-1 text-base font-bold">{a.title}</h3>
                    </div>
                    {!a.ended && <Tracker stage={a.stage} />}
                  </div>
                ))}
              </div>
            )
          )}

          {sec === "profile" && <CandidateProfileForm init={profile} />}

          {sec === "docs" && <CandidateDocuments initDocs={docs} />}

          {sec === "saved" && (
            saved.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-bl-line bg-white p-10 text-center text-bl-gray2">まだお気に入りはありません。<Link href="/" className="mt-2 block font-semibold text-bl-red">求人を探す →</Link></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {saved.map((j) => (
                  <div key={j.id} className="flex items-start gap-2 rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
                    <Link href={`/jobs/${j.id}`} className="min-w-0 flex-1">
                      <span className="rounded-full bg-bl-bluesoft px-2 py-0.5 text-[11px] font-bold text-bl-blue">{j.industry}</span>
                      <h3 className="mt-1.5 text-sm font-bold leading-snug">{j.title}</h3>
                      {j.salaryMain && <div className="mt-1 text-sm font-bold text-bl-red">💴 {j.salaryMain}</div>}
                      <div className="mt-0.5 text-xs text-bl-gray">📍 {j.location}{j.city ? ` ${j.city}` : ""}</div>
                    </Link>
                    <button onClick={() => unsave(j.id)} className="flex-none rounded-full p-1.5 text-bl-red hover:bg-bl-redsoft" title="お気に入りから削除">♥</button>
                  </div>
                ))}
              </div>
            )
          )}

          {sec === "messages" && (
            <div className="overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm">
              {INBOX.map((m, i) => (
                <div key={i} className={`flex gap-3 border-b border-bl-line p-4 last:border-0 ${m.unread ? "bg-[#FFFBFA]" : ""}`}>
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl font-black text-white" style={{ background: m.color }}>{m.from.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><b className="text-sm">{m.from}</b><span className="ml-auto text-[11px] text-bl-gray2">{m.time}</span></div>
                    <p className="mt-1 text-sm text-bl-gray">{m.text}</p>
                  </div>
                  {m.unread && <span className="mt-1 h-2 w-2 flex-none rounded-full bg-bl-red" />}
                </div>
              ))}
            </div>
          )}

          {sec === "settings" && (
            <div className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
              <h3 className="text-base font-black">アカウント設定</h3>
              <dl className="mt-3 divide-y divide-bl-line text-sm">
                <div className="flex justify-between py-2.5"><dt className="text-bl-gray">お名前</dt><dd className="font-semibold">{name}</dd></div>
              </dl>
              <button onClick={logout} className="mt-4 rounded-xl border border-bl-line px-4 py-2.5 text-sm font-bold text-bl-red hover:bg-bl-redsoft">ログアウト</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
