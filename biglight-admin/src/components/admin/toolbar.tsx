"use client";

import { useState, useEffect, useRef } from "react";

// ===== Bộ icon line dùng chung cho toolbar mọi bảng (đồng bộ logo) =====
const S = ({ children, size = 15 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
export const SearchIcon = () => <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
export const FilterIcon = () => <S><path d="M3 5h18M6 12h12M10 19h4" /></S>;
export const SortIcon = () => <S><path d="m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16" /></S>;
export const ColumnsIcon = () => <S><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></S>;
export const CsvIcon = () => <S><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></S>;
export const PdfIcon = () => <S><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /><path d="M9 13v4M9 13h1.5a1.2 1.2 0 0 1 0 2.4H9" /></S>;
export const PrintIcon = () => <S><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></S>;
export const MailIcon = () => <S><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></S>;
export const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;

// ===== Dropdown dùng chung cho 絞り込み / 並び替え / 表示項目 =====
// Desktop: dropdown bám nút (như cũ). Mobile (<lg): Bottom Sheet ở giữa đáy + overlay mờ + bấm ngoài/Esc để đóng.
// → KHÔNG bao giờ tràn ra ngoài màn hình.
export function Dropdown({ icon, label, badge, align = "left", width = "w-64", children }: {
  icon: React.ReactNode; label: string; badge?: number; align?: "left" | "right"; width?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="btn btn-ghost btn-sm gap-1.5">
        {icon}
        {label}
        {badge != null && badge > 0 && <span className="rounded-full bg-bl-red px-1.5 text-[10px] font-bold text-white">{badge}</span>}
      </button>
      {open && (
        <>
          {/* Overlay mờ — chỉ mobile */}
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />
          {/* Panel: mobile = bottom sheet vừa khít màn hình; desktop = dropdown bám nút */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute ${align === "right" ? "right-0" : "left-0"} z-30 mt-1 max-h-[70vh] ${width} max-w-[90vw] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl
              max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:mx-auto max-lg:mt-0 max-lg:w-[calc(100vw-32px)] max-lg:max-w-[380px] max-lg:max-h-[80dvh] max-lg:rounded-2xl max-lg:rounded-b-none max-lg:p-4 max-lg:pb-[calc(16px+env(safe-area-inset-bottom))] max-lg:shadow-2xl`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// ===== Xuất CSV / mở cửa sổ in (PDF & 印刷 chung 1 cửa sổ in) =====
export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function openPrintTable(title: string, headers: string[], rows: string[][]) {
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:"Noto Sans JP",sans-serif;color:#16181d;padding:24px}h1{font-size:18px;margin:0 0 4px}.meta{color:#5B6472;font-size:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;white-space:nowrap}th{background:#f1f5f9;font-weight:700}tr:nth-child(even) td{background:#fafafa}
@media print{@page{size:A4 landscape;margin:10mm}}</style></head><body>
<h1>${esc(title)}</h1><div class="meta">${rows.length}件 ・ ${new Date().toLocaleString("ja-JP")}</div>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload=function(){setTimeout(function(){window.print();},250);};</script></body></html>`;
  const w = window.open("", "_blank", "width=1200,height=800");
  if (!w) { alert("ポップアップがブロックされました。許可してください。"); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

// ===== Bộ nút 印刷 / CSV / PDF出力 dùng chung =====
export function ExportBar({ filename, title, getData, compact }: {
  filename: string; title: string; getData: () => { headers: string[]; rows: string[][] }; compact?: boolean;
}) {
  const [busy, setBusy] = useState<"csv" | "pdf" | "print" | null>(null);
  const run = (k: "csv" | "pdf" | "print", fn: () => void) => { setBusy(k); setTimeout(() => { try { fn(); } finally { setBusy(null); } }, 60); };
  const cls = `btn btn-ghost ${compact ? "btn-sm" : ""} gap-1.5 disabled:opacity-50`;
  const Spin = () => <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>;
  return (
    <>
      <button onClick={() => run("print", () => { const d = getData(); openPrintTable(title, d.headers, d.rows); })} disabled={busy != null} className={cls}>
        {busy === "print" ? <Spin /> : <PrintIcon />}<span className="hidden sm:inline">印刷</span>
      </button>
      <button onClick={() => run("csv", () => { const d = getData(); downloadCsv(filename, d.headers, d.rows); })} disabled={busy != null} className={cls}>
        {busy === "csv" ? <Spin /> : <CsvIcon />}<span className="hidden sm:inline">CSV</span>
      </button>
      <button onClick={() => run("pdf", () => { const d = getData(); openPrintTable(title, d.headers, d.rows); })} disabled={busy != null} className={cls}>
        {busy === "pdf" ? <Spin /> : <PdfIcon />}<span className="hidden sm:inline">PDF出力</span>
      </button>
    </>
  );
}
