"use client";

import { useEffect, useRef, useState } from "react";

const JP_RE = /[぀-ヿ㐀-䶿一-龯ｦ-ﾟ]/;
function isTouch() { return typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches; }

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder?: string;
  target?: "ja" | "vi" | "id" | "en";
  variant?: "round" | "button";
  onFocus?: () => void;
};

// Ô nhập chat: tự dịch sang `target` (mặc định tiếng Nhật) và hiện preview khi gõ ngôn ngữ khác.
// Mobile: Enter xuống dòng (gửi bằng nút) để tránh gửi nhầm; font 16px tránh iOS auto-zoom.
export function ChatComposer({ value, onChange, onSend, sending, placeholder, target = "ja", variant = "round", onFocus }: Props) {
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = value.trim();
    if (timer.current) clearTimeout(timer.current);
    if (!t || JP_RE.test(t)) { setPreview(""); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t, target }) });
        const j = await r.json().catch(() => ({}));
        setPreview(j.translated && j.translated !== t ? j.translated : "");
      } catch { setPreview(""); } finally { setLoading(false); }
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, target]);

  function submit() { if (!value.trim() || sending) return; onSend(); setPreview(""); }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !isTouch()) { e.preventDefault(); submit(); }
  }

  return (
    <div className="border-t border-bl-line bg-white p-2.5">
      {(loading || preview) && (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-bl-line bg-bl-bg px-3 py-2 text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-bl-blue"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-bl-blue">{target === "ja" ? "日本語に翻訳 / Bản dịch tiếng Nhật" : "翻訳プレビュー"}</div>
            <div className="mt-0.5 whitespace-pre-wrap break-words text-ink">{loading ? "翻訳中… / Đang dịch…" : preview}</div>
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          onFocus={onFocus}
          rows={1}
          placeholder={placeholder}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-bl-line bg-bl-bg px-4 py-2.5 text-base outline-none focus:border-bl-red"
        />
        {variant === "round" ? (
          <button onClick={submit} disabled={sending || !value.trim()} aria-label="送信" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-bl-red text-white transition hover:bg-bl-redd disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
          </button>
        ) : (
          <button onClick={submit} disabled={sending || !value.trim()} className="btn btn-navy h-11 flex-none px-5 disabled:opacity-40">送信</button>
        )}
      </div>
    </div>
  );
}
