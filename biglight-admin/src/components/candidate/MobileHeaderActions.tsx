"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MessengerLink from "@/components/common/MessengerLink";

type Noti = { id: string; type: string; title: string; body: string | null; link: string | null; isRead: boolean; createdAt: string };

// Chuông thông báo (polling ~30s) + nút メッセージ — dùng ở header mobile.
export default function MobileHeaderActions({ loggedIn }: { loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Noti[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    if (!loggedIn) return;
    try {
      const r = await fetch("/api/candidate/notifications");
      const j = await r.json();
      setItems(j.notifications || []);
      setUnread(j.unread || 0);
    } catch { /* ignore */ }
  }
  useEffect(() => {
    if (!loggedIn) return;
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function openBell() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      fetch("/api/candidate/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
      setUnread(0);
      setItems((p) => p.map((i) => ({ ...i, isRead: true })));
    }
  }

  const unreadMsg = loggedIn && items.some((i) => !i.isRead && i.type === "message");

  return (
    <div className="flex items-center gap-1">
      {/* Messenger (Facebook) — nổi bật, ưu tiên nhắn qua FB */}
      <MessengerLink variant="compact" />

      {/* メッセージ */}
      <Link href="/mypage?sec=messages" className="relative flex h-9 w-9 items-center justify-center rounded-full text-bl-gray hover:bg-bl-bg" aria-label="メッセージ">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" /></svg>
        {unreadMsg && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-bl-red" />}
      </Link>

      {/* Chuông */}
      <div ref={ref} className="relative">
        <button onClick={openBell} className="relative flex h-9 w-9 items-center justify-center rounded-full text-bl-gray hover:bg-bl-bg" aria-label="お知らせ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          {loggedIn && unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-bl-red px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
        </button>
        {open && (
          <div className="absolute right-0 top-11 z-50 w-72 max-w-[85vw] overflow-hidden rounded-xl border border-bl-line bg-white shadow-xl">
            <div className="border-b border-bl-line px-3 py-2 text-sm font-bold text-ink">お知らせ</div>
            <div className="max-h-80 overflow-y-auto">
              {!loggedIn ? (
                <div className="p-4 text-center text-xs text-bl-gray2">ログインすると通知が表示されます。</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-center text-xs text-bl-gray2">通知はありません。</div>
              ) : (
                items.map((n) => (
                  <Link key={n.id} href={n.link || "/mypage"} onClick={() => setOpen(false)} className="block border-b border-bl-line px-3 py-2 last:border-0 hover:bg-bl-bg">
                    <div className="text-xs font-bold text-ink">{n.title}</div>
                    {n.body && <div className="mt-0.5 line-clamp-1 text-[11px] text-bl-gray">{n.body}</div>}
                    <div className="mt-0.5 text-[10px] text-bl-gray2">{new Date(n.createdAt).toLocaleString("ja-JP")}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
