"use client";

import { useRouter } from "next/navigation";
import { ROLE_LABEL } from "@/lib/constants";
import { ADMIN_LEVEL_LABEL, ADMIN_LEVEL_TONE, type AdminLevel } from "@/lib/adminAccess";
import { Badge } from "@/components/ui/Badge";

export function Header({ name, role, level, onToggle }: { name: string; role: string; level: AdminLevel | null; onToggle?: () => void }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      {onToggle && (
        <button onClick={onToggle} aria-label="メニューを開閉" className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink md:flex">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
      )}
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-bold leading-tight">{name}</div>
          {level ? (
            <Badge tone={ADMIN_LEVEL_TONE[level]}>{ADMIN_LEVEL_LABEL[level]}</Badge>
          ) : (
            <Badge tone="navy">{ROLE_LABEL[role] ?? role}</Badge>
          )}
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm text-xs">
          ログアウト
        </button>
      </div>
    </header>
  );
}
