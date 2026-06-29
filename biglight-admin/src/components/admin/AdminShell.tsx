"use client";

import { useEffect, useState } from "react";
import type { Role } from "@prisma/client";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { AdminLevel } from "@/lib/adminAccess";

// Khung admin: giữ trạng thái thu gọn sidebar (nhớ qua localStorage).
export function AdminShell({ name, role, level, perms, children }: { name: string; role: Role; level: AdminLevel | null; perms?: string[]; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem("bl_sidebar_collapsed") === "1"); }, []);
  function toggle() {
    setCollapsed((c) => { const n = !c; try { localStorage.setItem("bl_sidebar_collapsed", n ? "1" : "0"); } catch { /* ignore */ } return n; });
  }
  return (
    <div className="min-h-screen">
      <Sidebar role={role} level={level} perms={perms} collapsed={collapsed} />
      <div className={`${collapsed ? "md:pl-16" : "md:pl-60"} transition-[padding] duration-200`}>
        <Header name={name} role={role} level={level} onToggle={toggle} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
