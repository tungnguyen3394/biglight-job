"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { NAV_GROUPS } from "@/lib/constants";

// SVG line icon cho từng mục menu (không dùng emoji)
const ICONS: Record<string, React.ReactNode> = {
  "/admin": <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  "/admin/candidates": <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M17 8h4M19 6v4" /></>,
  "/admin/jobs": <><path d="M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  "/admin/pipeline": <><path d="M3 6h18M3 12h18M3 18h12" /></>,
  "/admin/companies": <><path d="M3 21V7l9-4 9 4v14" /><path d="M9 21v-6h6v6" /><path d="M7 10h.01M12 10h.01M17 10h.01" /></>,
  "/admin/partners": <><circle cx="12" cy="8" r="3.5" /><path d="M5 21c0-4 3-6 7-6s7 2 7 6" /></>,
  "/admin/commissions": <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5h3.5a1.8 1.8 0 0 1 0 3.5H10" /></>,
  "/admin/articles": <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  "/admin/messages": <><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" /></>,
  "/admin/users": <><circle cx="12" cy="8" r="3.5" /><path d="M5 21c0-4 3-6 7-6s7 2 7 6" /></>,
  "/admin/settings": <><circle cx="12" cy="12" r="3" /><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.3-1-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.6 7.6 0 0 0 1.7-1l2.3 1 2-3.4z" /></>,
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-slate-200 bg-white px-3 py-4 md:flex">
      {/* Logo — tông đỏ thương hiệu như trang ứng viên */}
      <Link href="/admin" className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bl-red text-sm font-black text-white">B</div>
        <div className="text-[15px] font-black text-ink">BIGLIGHT<span className="text-bl-red"> Job</span></div>
      </Link>

      <nav className="flex flex-col gap-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => {
          const items = group.items.filter((n) => n.roles.includes(role));
          if (items.length === 0) return null;
          return (
            <div key={gi}>
              {group.title && (
                <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.title}</div>
              )}
              <div className="flex flex-col gap-0.5">
                {items.map((n) => {
                  const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active ? "bg-bl-redsoft font-semibold text-bl-red" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                      }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        {ICONS[n.href]}
                      </svg>
                      {n.jp}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
