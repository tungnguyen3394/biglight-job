"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { NAV } from "@/lib/constants";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-slate-200 bg-white p-3 md:flex">
      <div className="flex items-center gap-2 px-2 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-sm font-black text-white">
          B
        </div>
        <div className="text-[15px] font-black text-navy">
          BIGLIGHT <span className="text-brand-blue">Admin</span>
        </div>
      </div>
      <nav className="mt-2 flex flex-col gap-1">
        {items.map((n) => {
          const active =
            n.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-navy text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {n.jp}
              <span className="ml-1 text-[10px] font-normal opacity-60">
                {n.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
