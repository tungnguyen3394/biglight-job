"use client";

import { useState } from "react";

// Page username lấy từ ENV (KHÔNG hardcode). VD: NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME=biglightjob
const USERNAME = (process.env.NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME || "").trim();

// Gửi analytics event (gtag / GTM dataLayer / Meta Pixel) nếu có; không có thì bỏ qua.
function track(event: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...a: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...a: unknown[]) => void;
  };
  try {
    if (typeof w.gtag === "function") w.gtag("event", event, { source: "messenger_popup" });
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event });
    if (typeof w.fbq === "function") w.fbq("trackCustom", event);
  } catch { /* analytics không bắt buộc */ }
}

export default function MessengerPopupButton() {
  const [open, setOpen] = useState(false);
  const ready = USERNAME.length > 0;
  const messengerUrl = `https://m.me/${USERNAME}`;

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next) track("messenger_popup_open");
      return next;
    });
  }

  function startChat() {
    if (!ready) return;
    track("messenger_chat_start");
    // m.me tự mở app Messenger trên mobile, mở web trên desktop.
    window.open(messengerUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed bottom-20 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-5">
      {/* Popup */}
      <div
        role="dialog"
        aria-label="BIGLIGHT 担当チーム"
        aria-hidden={!open}
        className={`w-[360px] max-w-[calc(100vw-2rem)] origin-bottom-right overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        {/* Header: logo BIGLIGHT JOB */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-[#00B2FF] to-[#0866FF] p-4 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-black text-[#0866FF]">B</div>
          <div className="leading-tight">
            <b className="text-sm">BIGLIGHT 担当チーム</b>
            <p className="text-[11px] opacity-90">BIGLIGHT JOB サポート</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="閉じる" className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-xl leading-none transition hover:bg-white/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm leading-relaxed text-ink">
            ご相談ありがとうございます。<br />Facebook Messengerで担当者に直接相談できます。
          </p>

          <button
            onClick={startChat}
            disabled={!ready}
            aria-label="Messengerでチャットを開始"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0866FF] py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-bl-line disabled:text-bl-gray2 disabled:shadow-none"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.3 2 2 6.2 2 11.7c0 3.1 1.4 5.9 3.7 7.7V22l3.4-1.9c.9.25 1.9.38 2.9.38 5.7 0 10-4.2 10-9.7S17.7 2 12 2zm1 13.1l-2.6-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.3 5.7z" /></svg>
            Messengerでチャットを開始
          </button>

          {!ready && (
            <p className="mt-2 text-center text-xs font-semibold text-bl-gray2">現在Messengerは準備中です。</p>
          )}

          <button onClick={() => setOpen(false)} className="mt-2 w-full rounded-xl py-2 text-sm font-semibold text-bl-gray hover:bg-bl-bg">
            閉じる
          </button>
        </div>
      </div>

      {/* Launcher */}
      <button
        onClick={toggle}
        aria-label="Messengerで相談"
        aria-expanded={open}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#0866FF] shadow-lg transition hover:scale-105"
      >
        {ready && <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-bl-red" />}
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.25 1.9.39 2.9.39 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.4l-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7z" /></svg>
      </button>
    </div>
  );
}
