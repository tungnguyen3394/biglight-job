"use client";

import { useRouter } from "next/navigation";
import { ROLE_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";

export function Header({ name, role }: { name: string; role: string }) {
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
          <Badge tone="navy">{ROLE_LABEL[role] ?? role}</Badge>
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm text-xs">
          ログアウト
        </button>
      </div>
    </header>
  );
}
