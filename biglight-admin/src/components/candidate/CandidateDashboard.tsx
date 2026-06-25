"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const STAGES = ["登録", "書類選考", "面接", "内定", "入社"];

export type AppView = { id: string; code: string; title: string; company: string; stage: number; statusLabel: string; ended: boolean };

function Tracker({ stage }: { stage: number }) {
  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {STAGES.map((label, i) => {
        const done = i < stage, cur = i === stage;
        return (
          <div key={label} className="flex flex-1 items-start" style={{ minWidth: 58 }}>
            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black ${done ? "border-bl-green bg-bl-green text-white" : cur ? "border-bl-red bg-bl-red text-white shadow-[0_0_0_4px_#FDECEA]" : "border-bl-line bg-bl-bg text-bl-gray2"}`}>{done ? "✓" : i + 1}</div>
              <div className={`text-[11px] font-semibold ${done ? "text-ink" : cur ? "font-black text-bl-red" : "text-bl-gray2"}`}>{label}</div>
            </div>
            {i < STAGES.length - 1 && <div className={`mt-4 h-[3px] flex-1 rounded ${done ? "bg-bl-green" : "bg-bl-line"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function CandidateDashboard({ name, apps, applied }: { name: string; apps: AppView[]; applied?: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">ようこそ、{name} さん 👋</h1>
          <p className="text-sm text-bl-gray">応募状況の確認・担当者との連絡ができます。</p>
        </div>
        <button onClick={logout} className="rounded-lg border border-bl-line px-3 py-2 text-sm font-semibold text-bl-gray hover:text-ink">ログアウト</button>
      </div>

      {applied && (
        <div className="mb-5 rounded-2xl border border-bl-green bg-bl-greensoft p-4 text-sm font-semibold text-bl-green">✓ 応募を受け付けました。担当者がご連絡します。</div>
      )}

      {/* Profile prompt — khuyến khích nhập đủ thông tin */}
      <div className="mb-5 rounded-2xl border border-bl-red/30 bg-bl-redsoft p-5">
        <h2 className="font-black text-bl-red">プロフィールを完成させよう</h2>
        <p className="mt-1 text-sm text-ink">在留資格・日本語レベル・希望条件を入力すると、あなたに合う求人が見つかりやすくなります。</p>
        <span className="mt-3 inline-block rounded-lg bg-bl-red px-4 py-2 text-sm font-bold text-white opacity-70">プロフィール入力（近日公開）</span>
      </div>

      {/* Applications */}
      <h2 className="mb-3 text-base font-black">応募状況・進捗</h2>
      {apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bl-line bg-white p-8 text-center text-bl-gray2">
          まだ応募はありません。
          <Link href="/" className="mt-2 block font-semibold text-bl-red">求人を探す →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <div key={a.id} className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded bg-bl-bg px-2 py-0.5 text-xs font-bold text-bl-gray">{a.code}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${a.ended ? "bg-bl-line text-bl-gray" : "bg-bl-redsoft text-bl-red"}`}>{a.statusLabel}</span>
                <h3 className="ml-1 text-base font-bold">{a.title}</h3>
              </div>
              <p className="mb-3 text-xs text-bl-gray">{a.company}</p>
              {!a.ended && <Tracker stage={a.stage} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
