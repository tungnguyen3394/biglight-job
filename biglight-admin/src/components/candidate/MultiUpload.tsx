"use client";

import { useState } from "react";

export type DocFile = { name: string; file: string; size: number };

// Uploader cho 1 slot — chọn & tải NHIỀU file cùng lúc.
export default function MultiUpload({
  slot, initFiles, accept = "image/*,application/pdf", addLabel = "＋ ファイルを追加", preview = false, onCountChange,
}: {
  slot: string;
  initFiles: DocFile[];
  accept?: string;
  addLabel?: React.ReactNode;
  preview?: boolean; // hiện thumbnail (ảnh)
  onCountChange?: (n: number) => void; // báo số file (để cập nhật trạng thái 提出済み)
}) {
  const [files, setFiles] = useState<DocFile[]>(initFiles ?? []);
  const [busy, setBusy] = useState(false);
  const apply = (list: DocFile[]) => { setFiles(list); onCountChange?.(list.length); };

  async function uploadMany(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    for (const file of Array.from(list)) {
      const fd = new FormData();
      fd.append("slot", slot);
      fd.append("file", file);
      const res = await fetch("/api/candidate/documents", { method: "POST", body: fd });
      if (res.ok) { const d = await res.json(); apply(d.files); }
      else alert((await res.json().catch(() => ({}))).error || `「${file.name}」のアップロードに失敗しました`);
    }
    setBusy(false);
  }
  async function removeOne(file: string) {
    const res = await fetch("/api/candidate/documents", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot, file }) });
    if (res.ok) { const d = await res.json(); apply(d.files); }
  }

  return (
    <div>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-bl-line bg-white py-3 text-sm font-semibold text-bl-gray hover:border-bl-red hover:text-bl-red">
        <input type="file" accept={accept} multiple className="hidden" disabled={busy} onChange={(e) => { uploadMany(e.target.files); e.target.value = ""; }} />
        {busy ? "アップロード中…" : addLabel}
      </label>
      {files.length > 0 && (
        preview ? (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {files.map((f) => (
              <div key={f.file} className="group relative overflow-hidden rounded-lg border border-bl-line bg-bl-bg">
                <img src={`/api/candidate/documents?slot=${slot}&file=${encodeURIComponent(f.file)}`} alt={f.name} className="aspect-square w-full object-cover" />
                <button type="button" onClick={() => removeOne(f.file)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-xs font-bold text-white hover:bg-bl-red" aria-label="削除">×</button>
              </div>
            ))}
          </div>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {files.map((f) => (
              <li key={f.file} className="flex items-center gap-2 rounded-lg border border-bl-line bg-white px-3 py-2 text-sm">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9AA2AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21.4 11.05 12.25 20.2a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49" /></svg>
                <span className="flex-1 truncate">{f.name}</span>
                <a href={`/api/candidate/documents?slot=${slot}&file=${encodeURIComponent(f.file)}`} className="text-xs font-semibold text-bl-blue hover:underline">DL</a>
                <button type="button" onClick={() => removeOne(f.file)} className="text-xs font-bold text-bl-gray2 hover:text-bl-red">×</button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
