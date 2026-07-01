"use client";

import { useEffect } from "react";

// Thanh thao tác cho trang 履歴書PDF — ẩn khi in. Tự mở hộp thoại in 1 lần.
export default function PrintBar() {
  useEffect(() => {
    const t = setTimeout(() => { try { window.print(); } catch { /* ignore */ } }, 500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-bl-line bg-white/95 px-4 py-3 backdrop-blur">
      <button onClick={() => window.close()} className="rounded-xl border border-bl-line px-4 py-2 text-sm font-bold text-bl-gray hover:bg-bl-bg">閉じる</button>
      <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl bg-bl-red px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-bl-redd">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
        PDF保存 / 印刷
      </button>
    </div>
  );
}
