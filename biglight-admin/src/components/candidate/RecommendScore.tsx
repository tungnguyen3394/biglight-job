"use client";

import { useState } from "react";
import Link from "next/link";
import type { Recommend } from "@/lib/recommend";

// おすすめ度 (tính thật từ hồ sơ ↔ đơn). Guest KHÔNG thấy điểm. Nút phụ「相談する」mở AI Chat hiện tại.
export default function RecommendScore({ jobId, jobTitle, loggedIn, rec }: { jobId: string; jobTitle: string; loggedIn?: boolean; rec: Recommend | null }) {
  const [open, setOpen] = useState(false);
  const loginHref = `/mypage?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`;

  // ===== Guest: không hiển thị điểm =====
  if (!loggedIn || !rec) {
    return (
      <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
        <span className="text-xs font-bold text-bl-gray2">おすすめ度</span>
        <p className="mt-1 text-sm font-bold text-ink">ログイン後に表示</p>
        <p className="mt-1 text-xs text-bl-gray">ログインするとおすすめ度を確認できます。</p>
        <div className="mt-3 flex gap-2">
          <Link href={loginHref} className="flex-1 rounded-xl border border-bl-line py-2.5 text-center text-sm font-bold text-ink hover:border-bl-red">ログイン</Link>
          <Link href={loginHref} className="flex-1 rounded-xl bg-bl-red py-2.5 text-center text-sm font-bold text-white hover:bg-bl-redd">無料登録</Link>
        </div>
      </div>
    );
  }

  const stars = "★".repeat(rec.stars) + "☆".repeat(5 - rec.stars);
  const askHref = `/mypage?sec=messages&ask=${encodeURIComponent(`「${jobTitle}」について相談したいです。`)}`;
  const chat = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" /></svg>;

  return (
    <>
      <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bl-gray2">おすすめ度</span>
          <span className="text-[10px] font-bold text-bl-gray2">プロフィール判定</span>
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-black leading-none text-bl-red">{rec.score}<span className="text-lg">%</span></span>
          <span className="mb-0.5 text-base leading-none tracking-tight text-bl-red">{stars}</span>
        </div>
        <p className="mt-2 text-sm leading-snug text-bl-gray">{rec.summary}</p>
        <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-xl bg-bl-red py-2.5 text-sm font-bold text-white transition hover:bg-bl-redd">理由を見る</button>
        <a href={askHref} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-bl-line py-2.5 text-sm font-bold text-bl-gray transition hover:border-bl-red hover:text-bl-red">
          {chat}この求人について相談する
        </a>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl sm:inset-x-0 sm:bottom-auto sm:top-1/2 sm:w-[calc(100vw-32px)] sm:-translate-y-1/2 sm:rounded-3xl sm:pb-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-bl-line sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-ink">おすすめ度</h3>
              <button onClick={() => setOpen(false)} aria-label="閉じる" className="flex h-7 w-7 items-center justify-center rounded-full text-bl-gray2 hover:bg-bl-bg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-black leading-none text-bl-red">{rec.score}<span className="text-lg">%</span></span>
              <span className="mb-0.5 text-base leading-none tracking-tight text-bl-red">{stars}</span>
            </div>

            <ul className="mt-4 space-y-2">
              {rec.factors.map((f) => (
                <li key={f.key} className="flex items-start gap-2 text-sm">
                  {f.ok ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-bl-green"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-slate-300"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>
                  )}
                  <span className={f.ok ? "text-ink" : "text-bl-gray2"}><b className="font-bold">{f.label}</b> — {f.note}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] leading-relaxed text-bl-gray2">プロフィールと求人条件から算出しています。参考値です。プロフィールを充実させるとより正確になります。</p>
            <a href={askHref} onClick={() => setOpen(false)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-bl-red py-3 text-sm font-bold text-white">
              {chat}この求人について相談する
            </a>
          </div>
        </div>
      )}
    </>
  );
}
