"use client";

import { useRouter } from "next/navigation";
import { ROLE_LABEL } from "@/lib/constants";
import { ADMIN_LEVEL_LABEL, ADMIN_LEVEL_TONE, type AdminLevel } from "@/lib/adminAccess";
import { Badge } from "@/components/ui/Badge";

export function Header({ name, role, level }: { name: string; role: string; level: AdminLevel | null }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
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
