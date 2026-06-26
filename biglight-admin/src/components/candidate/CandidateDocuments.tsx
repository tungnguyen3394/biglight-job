"use client";

import MultiUpload, { type DocFile } from "./MultiUpload";

export type { DocFile };
export type DocMap = Record<string, DocFile[]>;

const DOCSLOTS = [
  { id: "rirekisho", label: "1. 履歴書", hint: "日本語の履歴書（複数可）" },
  { id: "zairyu", label: "2. 在留カード（両面）", hint: "表・裏の両面。複数可" },
  { id: "hyouka", label: "3. 専門級 または 評価調書", hint: "技能実習の評価調書など（複数可）" },
  { id: "jlpt", label: "4. 日本語能力試験（JLPT）", hint: "合格証明書。複数可" },
  { id: "tokutei", label: "5. 特定技能の資格", hint: "技能試験の合格証など。複数可" },
];

export default function CandidateDocuments({ initDocs }: { initDocs: DocMap }) {
  return (
    <div className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-black">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bl-red text-white">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></svg>
        </span>提出書類
      </h2>
      <p className="mb-4 text-xs text-bl-gray">画像・PDF（1ファイル最大10MB）。複数まとめて選択できます。アップロードした書類は担当者のみ閲覧します。</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {DOCSLOTS.map((d) => (
          <div key={d.id} className="rounded-xl border border-bl-line bg-bl-bg p-3">
            <div className="text-sm font-bold">{d.label}</div>
            <div className="mb-2 text-xs text-bl-gray2">{d.hint}</div>
            <MultiUpload slot={d.id} initFiles={initDocs[d.id] ?? []} />
          </div>
        ))}
      </div>
    </div>
  );
}
