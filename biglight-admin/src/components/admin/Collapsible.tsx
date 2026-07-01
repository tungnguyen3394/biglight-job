"use client";

import { useEffect, useState } from "react";

// Card có thể thu/mở, nhớ trạng thái trong localStorage (per section id).
export default function Collapsible({ id, title, icon, defaultOpen = true, children }: {
  id: string; title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(`bl_set_${id}`) : null;
    if (v !== null) setOpen(v === "1");
    setReady(true);
  }, [id]);
  useEffect(() => { if (ready && typeof window !== "undefined") localStorage.setItem(`bl_set_${id}`, open ? "1" : "0"); }, [open, ready, id]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-5 py-4 text-left transition hover:bg-slate-50">
        <span className="text-bl-red">{icon}</span>
        <h2 className="text-base font-black text-ink">{title}</h2>
        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-slate-400">
          {open ? "閉じる" : "開く"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>
      {open && <div className="border-t border-slate-100 p-5">{children}</div>}
    </section>
  );
}
