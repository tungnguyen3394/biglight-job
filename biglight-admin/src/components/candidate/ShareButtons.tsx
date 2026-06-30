"use client";

import { useState } from "react";

// Nút chia sẻ cuối bài: Facebook / X / LINE / Copy link (Instagram không hỗ trợ share link qua web).
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  const x = `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
  const line = `https://social-plugins.line.me/lp/share?url=${u}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  const cls = "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90";

  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="rounded-2xl border border-bl-line bg-white p-4">
        <div className="mb-3 text-sm font-bold text-bl-gray">この記事をシェア</div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <a href={fb} target="_blank" rel="noopener noreferrer" className={`${cls} bg-[#1877F2]`} aria-label="Facebookでシェア">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.89v2.25h3.32l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07z" /></svg>
            Facebook
          </a>
          <a href={x} target="_blank" rel="noopener noreferrer" className={`${cls} bg-black`} aria-label="Xでシェア">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7 8 8.2 12h-6.4l-5-7.3L6.1 22H3l7.5-8.6L2.5 2h6.6l4.5 6.7L18.9 2zm-2.2 18h1.7L8.2 4H6.4l10.3 16z" /></svg>
            X
          </a>
          <a href={line} target="_blank" rel="noopener noreferrer" className={`${cls} bg-[#06C755]`} aria-label="LINEでシェア">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.66 2 11.16c0 4.03 3.57 7.4 8.39 8.04.33.07.77.22.88.5.1.26.07.66.03.92l-.14.85c-.04.25-.2.99.87.54s5.77-3.4 7.87-5.82h-.01C21.3 14.5 22 12.94 22 11.16 22 6.66 17.5 3 12 3zM8.13 13.6H6.14a.53.53 0 0 1-.53-.53V9.1a.53.53 0 0 1 1.06 0v3.44h1.46a.53.53 0 0 1 0 1.06zm2.07-.53a.53.53 0 0 1-1.06 0V9.1a.53.53 0 0 1 1.06 0v3.97zm4.76 0a.53.53 0 0 1-.36.5.55.55 0 0 1-.17.03.53.53 0 0 1-.43-.21l-2.04-2.78v2.46a.53.53 0 0 1-1.06 0V9.1a.53.53 0 0 1 .36-.5.53.53 0 0 1 .6.18l2.04 2.78V9.1a.53.53 0 0 1 1.06 0v3.97zm3.3-2.51a.53.53 0 0 1 0 1.06h-1.46v.93h1.46a.53.53 0 0 1 0 1.05h-1.99a.53.53 0 0 1-.53-.52V9.1a.53.53 0 0 1 .53-.53h1.99a.53.53 0 0 1 0 1.06h-1.46v.93h1.46z" /></svg>
            LINE
          </a>
          <button onClick={copy} className={`${cls} bg-bl-gray`} aria-label="リンクをコピー">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></svg>
            {copied ? "コピー済み" : "リンクをコピー"}
          </button>
        </div>
      </div>
    </div>
  );
}
