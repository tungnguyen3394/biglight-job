"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FB_PAGE_URL } from "@/lib/site";
import FbChat from "@/components/public/FbChat";

const STAGES = ["登録", "書類選考", "面接", "内定", "入社"];

const FbIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
  </svg>
);

// Demo dữ liệu (sẽ thay bằng dữ liệu thật của ứng viên khi có đăng nhập Facebook ở GĐ sau).
type App = { code: string; title: string; company: string; stage: number; applied: string; msg: string };
const DEMO_APPS: App[] = [
  { code: "CON-002", title: "型枠大工", company: "中部建設 株式会社", stage: 2, applied: "2026/06/14", msg: "面接日程を調整中です。" },
  { code: "MFG-001", title: "半自動溶接スタッフ", company: "トヨタ系 金属部品メーカー", stage: 1, applied: "2026/06/18", msg: "企業が書類を確認しています。" },
];
const DEMO_INBOX = [
  { from: "BIGLIGHT サポート", time: "10分前", text: "プロフィールを完成させると、マッチング求人が3倍になります。", unread: true, color: "#D02E26" },
  { from: "グェン・ホア（製造担当）", time: "1時間前", text: "型枠大工の面接日程について、ご希望の日をお知らせください。", unread: true, color: "#2563EB" },
  { from: "BIGLIGHT サポート", time: "昨日", text: "半自動溶接スタッフへの応募を受け付けました。", unread: false, color: "#1F9D55" },
];

function Tracker({ stage }: { stage: number }) {
  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {STAGES.map((label, i) => {
        const done = i < stage;
        const cur = i === stage;
        return (
          <div key={label} className="flex flex-1 items-start" style={{ minWidth: 60 }}>
            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black ${
                  done
                    ? "border-bl-green bg-bl-green text-white"
                    : cur
                    ? "border-bl-red bg-bl-red text-white shadow-[0_0_0_4px_#FDECEA]"
                    : "border-bl-line bg-bl-bg text-bl-gray2"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <div className={`text-[11px] font-semibold ${done ? "text-ink" : cur ? "font-black text-bl-red" : "text-bl-gray2"}`}>{label}</div>
            </div>
            {i < STAGES.length - 1 && <div className={`mt-4 h-[3px] flex-1 rounded ${done ? "bg-bl-green" : "bg-bl-line"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function MyPageInner() {
  const params = useSearchParams();
  const applyCode = params.get("apply");
  const applyTitle = params.get("t");
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState<"apps" | "inbox">("apps");

  useEffect(() => {
    try {
      if (localStorage.getItem("bl_cand_login") === "1") setLoggedIn(true);
    } catch {}
  }, []);

  function login() {
    try { localStorage.setItem("bl_cand_login", "1"); } catch {}
    setLoggedIn(true);
  }
  function logout() {
    try { localStorage.removeItem("bl_cand_login"); } catch {}
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#15171d] to-[#3d1411] p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bl-red text-2xl font-black text-white">B</div>
          <h1 className="text-xl font-black">マイページにログイン</h1>
          <p className="mt-2 text-sm text-bl-gray">Facebookでかんたん登録。応募状況の確認・担当者との連絡ができます。</p>
          {applyCode && (
            <p className="mt-3 rounded-lg bg-bl-redsoft px-3 py-2 text-xs font-semibold text-bl-red">
              「{applyTitle ?? applyCode}」への応募を続けるにはログインしてください。
            </p>
          )}
          <button onClick={login} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-bl-fb py-3 font-bold text-white hover:bg-[#0C63D4]">
            <FbIcon /> Facebookでログイン
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-bl-gray2">
            ※ デモ版です。実際のFacebook連携は次の段階で有効化します。
          </p>
          <Link href="/" className="mt-4 inline-block text-xs font-semibold text-bl-gray hover:text-ink">← 求人一覧へ戻る</Link>
        </div>
        <FbChat />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bl-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-bl-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bl-red text-lg font-black text-white">B</span>
            <span className="text-lg font-black">BIGLIGHT<span className="text-bl-red"> JOB</span></span>
          </Link>
          <button onClick={logout} className="ml-auto text-sm font-semibold text-bl-gray hover:text-ink">ログアウト</button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {applyCode && (
          <div className="mb-5 rounded-2xl border border-bl-green bg-bl-greensoft p-4 text-sm font-semibold text-bl-green">
            ✓ 「{applyTitle ?? applyCode}」への応募を受け付けました。担当者がご連絡します。
          </div>
        )}

        {/* Tabs */}
        <div className="mb-5 flex gap-2">
          <button onClick={() => setTab("apps")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "apps" ? "bg-bl-red text-white" : "bg-white text-bl-gray"}`}>応募状況・進捗</button>
          <button onClick={() => setTab("inbox")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "inbox" ? "bg-bl-red text-white" : "bg-white text-bl-gray"}`}>メッセージ</button>
        </div>

        {tab === "apps" ? (
          <div className="space-y-4">
            {DEMO_APPS.map((a) => (
              <div key={a.code} className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded bg-bl-bg px-2 py-0.5 text-xs font-bold text-bl-gray">{a.code}</span>
                  <span className="rounded-full bg-bl-redsoft px-2.5 py-0.5 text-xs font-bold text-bl-red">{STAGES[a.stage]}</span>
                  <h3 className="ml-1 text-base font-bold">{a.title}</h3>
                </div>
                <Tracker stage={a.stage} />
                <p className="mt-3 rounded-lg bg-bl-bg p-3 text-sm text-bl-gray">
                  <b className="text-ink">次のステップ：</b>
                  {a.msg}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm">
            {DEMO_INBOX.map((m, i) => (
              <div key={i} className={`flex gap-3 border-b border-bl-line p-4 last:border-0 ${m.unread ? "bg-[#FFFBFA]" : ""}`}>
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl font-black text-white" style={{ background: m.color }}>
                  {m.from.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="text-sm">{m.from}</b>
                    <span className="ml-auto text-[11px] text-bl-gray2">{m.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-bl-gray">{m.text}</p>
                </div>
                {m.unread && <span className="mt-1 h-2 w-2 flex-none rounded-full bg-bl-red" />}
              </div>
            ))}
          </div>
        )}
      </main>

      <FbChat />
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense fallback={null}>
      <MyPageInner />
    </Suspense>
  );
}
