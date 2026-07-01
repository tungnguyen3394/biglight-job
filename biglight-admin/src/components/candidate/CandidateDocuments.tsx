"use client";

import { useState } from "react";
import MultiUpload, { type DocFile } from "./MultiUpload";

export type { DocFile };
export type DocMap = Record<string, DocFile[]>;

const DOCSLOTS = [
  { id: "rirekisho", label: "履歴書", hint: "日本語の履歴書（複数可）" },
  { id: "zairyu", label: "在留カード（両面）", hint: "表・裏の両面。複数可" },
  { id: "hyouka", label: "専門級 / 評価調書", hint: "技能実習の評価調書など" },
  { id: "jlpt", label: "日本語能力試験（JLPT）", hint: "合格証明書" },
  { id: "tokutei", label: "特定技能の資格", hint: "技能試験の合格証など" },
];

const IconUpload = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 9l5-5 5 5" /><path d="M12 4v12" /></svg>);

// 1 mục tài liệu — accordion: đóng chỉ hiện tên + trạng thái; mở mới hiện nút upload.
function DocRow({ slot, label, hint, initFiles }: { slot: string; label: string; hint: string; initFiles: DocFile[] }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initFiles.length);
  const done = count > 0;
  return (
    <div className="overflow-hidden rounded-xl border border-bl-line bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{label}</span>
        <span className={`flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${done ? "bg-bl-greensoft text-bl-green" : "bg-bl-bg text-bl-gray2"}`}>
          {done ? (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>提出済み{count > 1 ? `・${count}` : ""}</>
          ) : "未提出"}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA2AE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-none transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="border-t border-bl-line bg-bl-bg/50 p-3.5">
          <p className="mb-2 text-xs text-bl-gray2">{hint}・画像/PDF（最大10MB）</p>
          <MultiUpload slot={slot} initFiles={initFiles} addLabel={<span className="flex items-center gap-1.5"><IconUpload /> アップロード</span>} onCountChange={setCount} />
        </div>
      )}
    </div>
  );
}

export default function CandidateDocuments({ initDocs }: { initDocs: DocMap }) {
  return (
    <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-1 flex items-center gap-2 text-base font-black">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bl-red text-white">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></svg>
        </span>提出書類
      </h2>
      <p className="mb-3 text-xs text-bl-gray">各項目をタップして提出します。担当者のみ閲覧します。</p>
      <div className="space-y-2">
        {DOCSLOTS.map((d) => (
          <DocRow key={d.id} slot={d.id} label={d.label} hint={d.hint} initFiles={initDocs[d.id] ?? []} />
        ))}
      </div>
    </div>
  );
}
