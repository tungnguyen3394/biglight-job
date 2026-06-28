"use client";

import { useEffect, useRef, useState } from "react";

// Dropdown chọn nhiều (cho タグ) — khung đồng bộ với các select khác.
export default function MultiSelect({ label, options, value, onChange, compact }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={`flex w-full items-center justify-between rounded-xl border border-bl-line bg-white px-3 font-semibold ${compact ? "py-2.5 text-[13px]" : "py-3 text-sm"}`}>
        <span className={value.length ? "text-ink" : "text-bl-gray2"}>{value.length ? `${label}（${value.length}）` : label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute z-40 mt-1 max-h-64 w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-bl-line bg-white p-1 shadow-xl">
          {options.map((o) => (
            <button key={o} type="button" onClick={() => toggle(o)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${value.includes(o) ? "bg-bl-redsoft font-semibold text-bl-red" : "hover:bg-bl-bg"}`}>
              <span className={`flex h-4 w-4 flex-none items-center justify-center rounded border text-[10px] ${value.includes(o) ? "border-bl-red bg-bl-red text-white" : "border-bl-line"}`}>{value.includes(o) ? "✓" : ""}</span>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
