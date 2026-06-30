"use client";

import { useState } from "react";
import { recommendScore } from "@/lib/recommend";

// おすすめスコア (mock) — điểm gợi ý nhanh trên trang chi tiết求人.
// Nút phụ「AIに相談」mở AI Chat hiện tại (/mypage→メッセージ) kèm context求人, KHÔNG tạo chat mới.
export default function RecommendScore({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [open, setOpen] = useState(false);
  const r = recommendScore(jobId);
  const stars = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
  const askHref = `/mypage?sec=messages&ask=${encodeURIComponent(`「${jobTitle}」について相談したいです。`)}`;
  const chat = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" /></svg>;

  return (
    <>
      {/* Card điểm gợi ý — đặt dưới phần lương / nút応募 */}
      <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bl-gray2">おすすめスコア</span>
          <span className="text-[10px] font-bold text-bl-gray2">AI分析（β）</span>
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-black leading-none text-bl-red">{r.score}<span className="text-lg">%</span></span>
          <span className="mb-0.5 text-base leading-none tracking-tight text-bl-red">{stars}</span>
        </div>
        <p className="mt-2 text-sm leading-snug text-bl-gray">{r.summary}</p>
        <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-xl bg-bl-red py-2.5 text-sm font-bold text-white transition hover:bg-bl-redd">理由を見る</button>
        <a href={askHref} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-bl-line py-2.5 text-sm font-bold text-bl-gray transition hover:border-bl-red hover:text-bl-red">
          {chat}この求人についてAIに相談
        </a>
      </div>

      {/* Bottom sheet (mobile) / modal (desktop) */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl sm:inset-x-0 sm:bottom-auto sm:top-1/2 sm:w-[calc(100vw-32px)] sm:-translate-y-1/2 sm:rounded-3xl sm:pb-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-bl-line sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-ink">おすすめスコア</h3>
              <button onClick={() => setOpen(false)} aria-label="閉じる" className="flex h-7 w-7 items-center justify-center rounded-full text-bl-gray2 hover:bg-bl-bg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-black leading-none text-bl-red">{r.score}<span className="text-lg">%</span></span>
              <span className="mb-0.5 text-base leading-none tracking-tight text-bl-red">{stars}</span>
            </div>
            <p className="mt-2 text-sm text-bl-gray">{r.summary}</p>

            <Section title="合っているポイント" items={r.reasons} tone="ok" />
            {r.missing.length > 0 && <Section title="不足している項目" items={r.missing} tone="warn" />}
            {r.suggestions.length > 0 && <Section title="プロフィール補強の提案" items={r.suggestions} tone="hint" />}

            <p className="mt-4 text-[11px] leading-relaxed text-bl-gray2">BIGLIGHT AIがプロフィールと求人条件をもとに分析しています。</p>
            <a href={askHref} onClick={() => setOpen(false)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-bl-red py-3 text-sm font-bold text-white">
              {chat}この求人についてAIに相談
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: "ok" | "warn" | "hint" }) {
  const dot = tone === "ok" ? "bg-bl-green" : tone === "warn" ? "bg-amber-400" : "bg-bl-blue";
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-xs font-bold text-bl-gray">{title}</div>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink"><span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${dot}`} />{t}</li>
        ))}
      </ul>
    </div>
  );
}
