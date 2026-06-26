"use client";

import { useState } from "react";
import { PUBLIC_STATUS_LABEL } from "@/lib/constants";
import { formatSalary, type JobRow } from "@/app/admin/jobs/types";

function header(seeCommission: boolean): string[] {
  return ["求人ID", "求人タイトル", "企業名", "職種", "勤務地", "募集人数", "給与", "寮", "夜勤", "シフト", "公開",
    "担当者", ...(seeCommission ? ["紹介報酬"] : []), "更新日"];
}
function toRow(r: JobRow, seeCommission: boolean): string[] {
  return [
    r.code, r.title, r.company ?? "", r.jobType ?? "", `${r.location}${r.city ? " " + r.city : ""}`,
    `${r.recruitCount}名`, formatSalary(r.salaryMin, r.salaryMax),
    r.dormitory ? "あり" : "なし", r.nightShift ? "あり" : "なし", r.shiftWork ? "あり" : "なし",
    PUBLIC_STATUS_LABEL[r.publicStatus] ?? r.publicStatus, r.staff ?? "",
    ...(seeCommission ? [r.commission != null ? "¥" + r.commission.toLocaleString("ja-JP") : ""] : []),
    new Date(r.updatedAt).toLocaleDateString("ja-JP"),
  ];
}

function IcBtn({ icon, label, busy, onClick }: { icon: React.ReactNode; label: string; busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy} className="btn btn-ghost gap-1.5 px-3 py-2 disabled:opacity-50">
      {busy ? <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg> : icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function ExportButtons({ rows, seeCommission }: { rows: JobRow[]; seeCommission: boolean }) {
  const [busy, setBusy] = useState<"csv" | "pdf" | "print" | null>(null);
  const run = (k: "csv" | "pdf" | "print", fn: () => void) => {
    setBusy(k);
    setTimeout(() => { try { fn(); } finally { setBusy(null); } }, 60);
  };

  function exportCsv() {
    const head = header(seeCommission);
    const lines = [head, ...rows.map((r) => toRow(r, seeCommission))]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["﻿" + lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `求人一覧_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openPrint(title: string) {
    const head = header(seeCommission);
    const body = rows.map((r) => `<tr>${toRow(r, seeCommission).map((c) => `<td>${String(c).replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("");
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>${title} — 求人一覧</title>
<style>
  body{font-family:"Noto Sans JP",sans-serif;color:#16181d;padding:24px;}
  h1{font-size:18px;margin:0 0 4px;} .meta{color:#5B6472;font-size:12px;margin-bottom:16px;}
  table{width:100%;border-collapse:collapse;font-size:11px;}
  th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;white-space:nowrap;}
  th{background:#f1f5f9;font-weight:700;}
  tr:nth-child(even) td{background:#fafafa;}
  @media print{@page{size:A4 landscape;margin:10mm;}}
</style></head><body>
  <h1>求人一覧</h1><div class="meta">${rows.length}件 ・ ${new Date().toLocaleString("ja-JP")}</div>
  <table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
</body></html>`;
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) { alert("ポップアップがブロックされました。許可してください。"); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  return (
    <div className="flex items-center gap-1.5">
      <IcBtn busy={busy === "print"} label="印刷" onClick={() => run("print", () => openPrint("印刷"))}
        icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>} />
      <IcBtn busy={busy === "csv"} label="CSV出力" onClick={() => run("csv", exportCsv)}
        icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /><path d="M8 13h2M8 17h2M14 13h2M14 17h2" /></svg>} />
      <IcBtn busy={busy === "pdf"} label="PDF出力" onClick={() => run("pdf", () => openPrint("PDF"))}
        icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /><path d="M9 13v4M9 13h1.5a1.2 1.2 0 0 1 0 2.4H9" /></svg>} />
    </div>
  );
}
