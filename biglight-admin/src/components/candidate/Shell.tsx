"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import LangSwitch from "./LangSwitch";
import SiteHeader, { type NavActive } from "./SiteHeader";
import { useLoginModal } from "./useLoginModal";
import MobileHeaderActions from "./MobileHeaderActions";

type Active = NavActive;

const NAV: { key: Active; label: string; href: string; icon: React.ReactNode }[] = [
  { key: "jobs", label: "求人", href: "/jobs", icon: <path d="M3 7h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> },
  { key: "tedori", label: "手取り", href: "/biglight-job-salary.html", icon: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8" /><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></> },
  { key: "about", label: "私たち", href: "/about", icon: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" /><circle cx="17.5" cy="9" r="2.2" /><path d="M15 20c0-2 1.2-3.4 4-3.4" /></> },
  { key: "guide", label: "ガイド", href: "/guide", icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" /></> },
  { key: "mypage", label: "マイページ", href: "/mypage", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></> },
];

// Link 手取り計算ツール (trang tĩnh dùng chung với マイページ) + nội dung popup khi chưa đăng nhập.
const TEDORI_HREF = "/biglight-job-salary.html";
const TEDORI_LOGIN = {
  redirect: TEDORI_HREF,
  title: "ログインが必要です",
  desc: "手取り計算ツールをご利用いただくには、無料会員登録またはログインが必要です。",
};

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
  loggedIn,
}: {
  active: Active;
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  loggedIn?: boolean;
}) {
  const router = useRouter();
  const controlled = typeof onSearchChange === "function";
  const [local, setLocal] = useState("");
  const { onRegister, modal } = useLoginModal();
  const value = controlled ? searchValue ?? "" : local;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!controlled) router.push(`/?q=${encodeURIComponent(local.trim())}`);
  }

  return (
    <div className="min-h-screen bg-bl-bg text-ink">
      {/* Desktop — header trên cùng dùng chung (SiteHeader) */}
      <SiteHeader active={active} loggedIn={loggedIn} onRegister={onRegister} />

      {/* Mobile — header 1 hàng: tìm kiếm + ngôn ngữ + Messenger + メッセージ + thông báo */}
      <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-bl-line bg-white/95 px-3 py-2.5 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-1.5"><Logo size={32} /></Link>
        <form onSubmit={onSubmit} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-bl-bg px-3 py-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AA2AE" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input value={value} onChange={(e) => (controlled ? onSearchChange!(e.target.value) : setLocal(e.target.value))} placeholder="仕事を検索 …" className="w-full bg-transparent text-sm outline-none" />
        </form>
        <LangSwitch compact />
        <MobileHeaderActions loggedIn={loggedIn} />
      </header>

      <main className="pb-24 lg:pb-10">{children}</main>

      {/* Bottom nav — chỉ mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-bl-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map((n) => {
          const cell = (activeCell: boolean) => (
            <span className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${activeCell ? "text-bl-red" : "text-bl-gray2"}`}>
              <Icon>{n.icon}</Icon>
              {n.label}
            </span>
          );

          // 手取り: đã đăng nhập → mở tool; chưa → popup đăng nhập (redirect về tool sau khi login).
          if (n.key === "tedori") {
            if (!loggedIn) {
              return (
                <button key={n.key} type="button" onClick={() => onRegister(TEDORI_LOGIN)} className="w-full">
                  {cell(active === n.key)}
                </button>
              );
            }
            return <a key={n.key} href={TEDORI_HREF}>{cell(active === n.key)}</a>;
          }

          // Chưa đăng nhập: tab マイ → CTA「無料登録」mở modal (không đi /mypage).
          if (n.key === "mypage" && !loggedIn) {
            return (
              <button key={n.key} type="button" onClick={onRegister} className="w-full">
                <span className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold text-bl-red">
                  <Icon><circle cx="9" cy="8" r="4" /><path d="M3 21c0-3.5 2.7-5.5 6-5.5" /><path d="M17 8v6M14 11h6" /></Icon>
                  無料登録
                </span>
              </button>
            );
          }
          return (
            <Link key={n.key} href={n.href}>
              {cell(active === n.key)}
            </Link>
          );
        })}
      </nav>

      {modal}
    </div>
  );
}
