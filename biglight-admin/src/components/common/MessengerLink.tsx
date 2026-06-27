"use client";

// Nút Messenger (Facebook) đặt ở header — mở m.me để nhắn trực tiếp với担当.
// Page username lấy từ ENV (KHÔNG hardcode): NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME=biglightjob
const USERNAME = (process.env.NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME || "").trim();

function track() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void };
  try {
    if (typeof w.gtag === "function") w.gtag("event", "messenger_chat_start", { source: "header" });
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: "messenger_chat_start" });
    if (typeof w.fbq === "function") w.fbq("trackCustom", "messenger_chat_start");
  } catch { /* analytics không bắt buộc */ }
}

const ICON = (
  <svg viewBox="0 0 24 24" fill="#fff" className="h-[18px] w-[18px]"><path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.25 1.9.39 2.9.39 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.4l-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7z" /></svg>
);

export default function MessengerLink({ variant = "compact" }: { variant?: "compact" | "pill" }) {
  if (!USERNAME) return null;
  const url = `https://m.me/${USERNAME}`;

  if (variant === "pill") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={track} aria-label="Messengerで相談"
        className="relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#00B2FF] to-[#0866FF] px-3.5 py-2 text-sm font-black text-white shadow-md ring-2 ring-[#0866FF]/15 transition hover:opacity-90">
        {ICON}
        Messengerで相談
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bl-red opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-bl-red" /></span>
      </a>
    );
  }

  // compact: hình tròn gradient nổi bật cho header mobile
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={track} aria-label="Messengerで相談"
      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#0866FF] shadow-md ring-2 ring-[#0866FF]/20 transition hover:scale-105">
      {ICON}
      <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bl-red opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-white bg-bl-red" /></span>
    </a>
  );
}
