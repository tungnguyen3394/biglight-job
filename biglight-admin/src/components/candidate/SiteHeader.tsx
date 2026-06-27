"use client";

import Link from "next/link";
import Logo from "./Logo";
import LangSwitch from "./LangSwitch";
import MessengerLink from "@/components/common/MessengerLink";

export type NavActive = "jobs" | "about" | "info" | "tokutei2" | "guide" | "mypage";

// Các mục trong dropdown 特定技能2号情報
export const TOKUTEI2_LINKS = [
  { href: "/tokutei2", label: "特定技能2号とは" },
  { href: "/tokutei2#exam", label: "試験情報" },
  { href: "/tokutei2#materials", label: "教材・資料" },
  { href: "/tokutei2#transition", label: "1号→2号 移行ガイド" },
  { href: "/tokutei2#faq", label: "よくある質問" },
];

// Header trên cùng dùng chung cho desktop (trang chủ + mọi trang). Mobile dùng Shell riêng.
export default function SiteHeader({ active, loggedIn, onRegister }: { active: NavActive; loggedIn?: boolean; onRegister?: () => void }) {
  const cls = (key: NavActive) => (active === key ? "text-bl-red" : "text-bl-gray hover:text-ink");

  return (
    <header className="sticky top-0 z-30 hidden border-b border-bl-line bg-white/95 backdrop-blur lg:block">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-3">
        <Link href="/" className="flex items-center gap-2"><Logo size={36} /><span className="text-lg font-black">BIGLIGHT<span className="text-bl-red"> JOB</span></span></Link>
        <nav className="flex items-center gap-5 text-sm font-bold">
          <Link href="/jobs" className={cls("jobs")}>求人を探す</Link>
          <Link href="/about" className={cls("about")}>私たちについて</Link>
          <Link href="/guide" className={cls("guide")}>特定技能ガイド</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <MessengerLink variant="pill" />
          <LangSwitch />
          {loggedIn ? (
            <Link href="/mypage" className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-black text-white shadow-md ${active === "mypage" ? "bg-bl-redd" : "bg-bl-red hover:bg-bl-redd"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></svg>
              マイページ
            </Link>
          ) : (
            <button onClick={onRegister} className="flex items-center gap-1.5 rounded-lg bg-bl-red px-4 py-2 text-sm font-black text-white shadow-md transition hover:bg-bl-redd">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4" /><path d="M3 21c0-4 3-6 6-6" /><path d="M17 8v6M14 11h6" /></svg>
              30秒で無料登録
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
