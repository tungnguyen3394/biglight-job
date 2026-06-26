"use client";

import { useState } from "react";

export type DocFile = { name: string; file: string; size: number };
export type DocMap = Record<string, DocFile[]>;

const DOCSLOTS = [
  { id: "rirekisho", label: "1. 履歴書", hint: "日本語の履歴書（1点）" },
  { id: "zairyu", label: "2. 在留カード（両面）", hint: "表・裏の両面。複数可" },
  { id: "hyouka", label: "3. 専門級 または 評価調書", hint: "技能実習の評価調書など（1点）" },
  { id: "jlpt", label: "4. 日本語能力試験（JLPT）", hint: "合格証明書。複数可" },
  { id: "tokutei", label: "5. 特定技能の資格", hint: "技能試験の合格証など。複数可" },
];

export default function CandidateDocuments({ initDocs }: { initDocs: DocMap }) {
  const [docs, setDocs] = useState<DocMap>(initDocs);
  const [uploading, setUploading] = useState<string | null>(null);

  async function upload(slot: string, file?: File | null) {
    if (!file) return;
    setUploading(slot);
    const fd = new FormData();
    fd.append("slot", slot);
    fd.append("file", file);
    const res = await fetch("/api/candidate/documents", { method: "POST", body: fd });
    setUploading(null);
    if (res.ok) { const d = await res.json(); setDocs((p) => ({ ...p, [slot]: d.files })); }
    else alert((await res.json().catch(() => ({}))).error || "アップロードに失敗しました");
  }
  async function removeDoc(slot: string, file: string) {
    const res = await fetch("/api/candidate/documents", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot, file }) });
    if (res.ok) { const d = await res.json(); setDocs((p) => ({ ...p, [slot]: d.files })); }
  }

  return (
    <div className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-black">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bl-red text-white">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></svg>
        </span>提出書類
      </h2>
      <p className="mb-4 text-xs text-bl-gray">画像・PDF（1ファイル最大10MB）。アップロードした書類は担当者のみ閲覧します。</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {DOCSLOTS.map((d) => (
          <div key={d.id} className="rounded-xl border border-bl-line bg-bl-bg p-3">
            <div className="text-sm font-bold">{d.label}</div>
            <div className="mb-2 text-xs text-bl-gray2">{d.hint}</div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-bl-line bg-white py-3 text-sm font-semibold text-bl-gray hover:border-bl-red hover:text-bl-red">
              <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploading === d.id} onChange={(e) => { upload(d.id, e.target.files?.[0]); e.target.value = ""; }} />
              {uploading === d.id ? "アップロード中…" : "＋ ファイルを追加"}
            </label>
            {(docs[d.id] ?? []).length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {docs[d.id].map((file) => (
                  <li key={file.file} className="flex items-center gap-2 rounded-lg border border-bl-line bg-white px-3 py-2 text-sm">
                    <span className="flex flex-1 items-center gap-1.5 truncate"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9AA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21.4 11.05 12.25 20.2a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49" /></svg>{file.name}</span>
                    <a href={`/api/candidate/documents?slot=${d.id}&file=${encodeURIComponent(file.file)}`} className="text-xs font-semibold text-bl-blue hover:underline">DL</a>
                    <button type="button" onClick={() => removeDoc(d.id, file.file)} className="text-xs font-bold text-bl-gray2 hover:text-bl-red">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
