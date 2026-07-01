"use client";

import { useState } from "react";
import Link from "next/link";
import { recommendScore } from "@/lib/recommend";

// おすすめ度 (mock) — điểm gợi ý nhanh. Guest KHÔNG thấy điểm (chỉ hiện sau khi đăng nhập).
// Nút phụ「AIに相談」mở AI Chat hiện tại (/mypage→メッセージ), KHÔNG tạo chat mới.
export default function RecommendScore({ jobId, jobTitle, loggedIn }: { jobId: string; jobTitle: string; loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const loginHref = `/mypage?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`;

  // ===== Guest: không hiển thị %/★, chỉ mời đăng nhập =====
  if (!loggedIn) {
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

  const r = recommendScore(jobId);
  const stars = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
  const askHref = `/mypage?sec=messages&ask=${encodeURIComponent(`「${jobTitle}」について相談したいです。`)}`;
  const chat = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" /></svg>;
  const CHECKS = ["勤務地", "日本語", "在留資格", "経験"];

  return (
    <>
      {/* Card おすすめ度 — dưới phần lương / nút応募 */}
      <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bl-gray2">おすすめ度</span>
          <span className="text-[10px] font-bold text-bl-gray2">システム判定</span>
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-black leading-none text-bl-red">{r.score}<span className="text-lg">%</span></span>
          <span className="mb-0.5 text-base leading-none tracking-tight text-bl-red">{stars}</span>
        </div>
        <p className="mt-2 text-sm leading-snug text-bl-gray">{r.summary}</p>
        <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-xl bg-bl-red py-2.5 text-sm font-bold text-white transition hover:bg-bl-redd">理由を見る</button>
        <a href={askHref} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-bl-line py-2.5 text-sm font-bold text-bl-gray transition hover:border-bl-red hover:text-bl-red">
          {chat}この求人について相談する
        </a>
      </div>

      {/* Bottom sheet (mobile) / modal (desktop) — ngắn gọn */}
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
              <span className="text-3xl font-black leading-none text-bl-red">{r.score}<span className="text-lg">%</span></span>
              <span className="mb-0.5 text-base leading-none tracking-tight text-bl-red">{stars}</span>
            </div>

            <ul className="mt-4 space-y-2">
              {CHECKS.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-bl-green"><path d="M20 6 9 17l-5-5" /></svg>
                  {t}
                </li>
              ))}
              {r.missing.length > 0 && (
                <li className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-none"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  未入力項目あり
                </li>
              )}
            </ul>

            <p className="mt-4 text-[11px] leading-relaxed text-bl-gray2">プロフィールと求人条件から算出しています。参考値です。</p>
            <a href={askHref} onClick={() => setOpen(false)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-bl-red py-3 text-sm font-bold text-white">
              {chat}この求人について相談する
            </a>
          </div>
        </div>
      )}
    </>
  );
}
