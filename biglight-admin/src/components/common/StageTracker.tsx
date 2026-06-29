"use client";

import { STAGES, type FlowEvent } from "@/lib/applicationFlow";

// Thanh 6 bước dùng chung user + admin.
export function StageTracker({ stage, ended }: { stage: number; ended?: boolean }) {
  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {STAGES.map((label, i) => {
        const done = i < stage, cur = i === stage && !ended;
        return (
          <div key={label} className="flex flex-1 items-start" style={{ minWidth: 64 }}>
            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-black ${done ? "border-emerald-500 bg-emerald-500 text-white" : cur ? "border-bl-red bg-bl-red text-white shadow-[0_0_0_4px_#FDECEA]" : "border-slate-200 bg-slate-50 text-slate-400"}`}>{done ? "✓" : i + 1}</div>
              <div className={`text-[11px] font-semibold ${done ? "text-ink" : cur ? "font-black text-bl-red" : "text-slate-400"}`}>{label}</div>
            </div>
            {i < STAGES.length - 1 && <div className={`mt-[18px] h-[3px] flex-1 rounded ${done ? "bg-emerald-500" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

// Dòng thời gian: mỗi bước + ngày + ghi chú đính kèm (memo). Dùng chung user + admin.
export function StageTimeline({ events, emptyText = "まだ進捗の更新はありません。" }: { events: FlowEvent[]; emptyText?: string }) {
  if (!events.length) return <p className="py-2 text-xs text-slate-400">{emptyText}</p>;
  return (
    <ol className="relative ml-1 space-y-3 border-l-2 border-slate-100 pl-4">
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <li key={i} className="relative">
            <span className={`absolute -left-[22px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${last ? "bg-bl-red ring-4 ring-bl-redsoft" : "bg-emerald-500"}`} />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm font-bold ${last ? "text-bl-red" : "text-ink"}`}>{e.label}</span>
              <span className="text-[11px] text-slate-400">{e.at}</span>
            </div>
            {e.memo && <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">{e.memo}</p>}
          </li>
        );
      })}
    </ol>
  );
}
