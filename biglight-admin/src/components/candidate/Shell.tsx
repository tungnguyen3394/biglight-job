"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FB_PAGE_URL } from "@/lib/site";
import Logo from "./Logo";

type Active = "jobs" | "about" | "info" | "mypage";

const NAV: { key: Active; label: string; href: string; icon: React.ReactNode }[] = [
  { key: "jobs", label: "求人を探す", href: "/", icon: <path d="M3 7h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> },
  { key: "about", label: "私たちについて", href: "/about", icon: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" /><circle cx="17.5" cy="9" r="2.2" /><path d="M15 20c0-2 1.2-3.4 4-3.4" /></> },
  { key: "info", label: "役立つ情報", href: "/info", icon: <><path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-4-7 4z" /></> },
  { key: "mypage", label: "マイページ", href: "/mypage", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></> },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default function Shell({
  active,
  children,
  searchValue,
  onSearchChange,
}: {
  active: Active;
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
}) {
  const router = useRouter();
  const controlled = typeof onSearchChange === "function";
  const [local, setLocal] = useState("");
  const value = controlled ? searchValue ?? "" : local;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!controlled) router.push(`/?q=${encodeURIComponent(local.trim())}`);
  }

  return (
    <div className="min-h-screen bg-bl-bg text-ink lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-bl-line bg-white p-4 lg:flex">
        <Link href="/" className="mb-4 flex items-center gap-2 px-2">
          <Logo size={36} />
          <span className="text-lg font-black">BIGLIGHT<span className="text-bl-red"> JOB</span></span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active === n.key ? "bg-bl-redsoft text-bl-red" : "text-bl-gray hover:bg-bl-bg hover:text-ink"}`}>
              <Icon>{n.icon}</Icon>{n.label}
            </Link>
          ))}
        </nav>
        <Link href="/mypage" className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-bl-fb py-3 text-sm font-bold text-white hover:bg-[#0C63D4]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
          登録・ログイン
        </Link>
      </aside>

      <div className="flex min-h-screen flex-col">
        {/* Header — search + notifications */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-bl-line bg-white/95 px-4 py-2.5 backdrop-blur">
          <Link href="/" className="flex items-center gap-1.5 lg:hidden">
            <Logo size={32} />
          </Link>
          <form onSubmit={onSubmit} className="flex flex-1 items-center gap-2 rounded-xl bg-bl-bg px-3 py-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AA2AE" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input
              value={value}
              onChange={(e) => (controlled ? onSearchChange!(e.target.value) : setLocal(e.target.value))}
              placeholder="仕事を検索（溶接、寮あり、愛知 …）"
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-bl-gray hover:bg-bl-bg" aria-label="お知らせ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-bl-red" />
          </button>
          <Link href="/mypage" className="hidden items-center gap-1.5 rounded-lg bg-bl-fb px-3 py-2 text-sm font-bold text-white sm:flex lg:hidden">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
            登録
          </Link>
        </header>

        <main className="flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-bl-line bg-white lg:hidden">
        {NAV.map((n) => (
          <Link key={n.key} href={n.href}>
            <span className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active === n.key ? "text-bl-red" : "text-bl-gray2"}`}>
              <Icon>{n.icon}</Icon>
              {n.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
