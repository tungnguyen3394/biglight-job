"use client";

import { useEffect, useRef, useState } from "react";

// 8 ngôn ngữ như bản gốc worker.html. Dịch tự động bằng Google Translate.
const LANGS = [
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "my", label: "Myanmar", flag: "🇲🇲" },
  { code: "ne", label: "Nepali", flag: "🇳🇵" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
];

export default function LangSwitch({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("日本語");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    // đọc ngôn ngữ hiện tại từ cookie googtrans (/ja/xx)
    const m = document.cookie.match(/googtrans=\/[^/]*\/([^;]+)/);
    if (m) { const f = LANGS.find((l) => l.code === decodeURIComponent(m[1])); if (f) setLabel(f.label); }
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function pick(code: string, lbl: string) {
    setLabel(lbl);
    setOpen(false);
    const trySet = (n = 0) => {
      const sel = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (sel) { sel.value = code; sel.dispatchEvent(new Event("change")); }
      else if (n < 30) setTimeout(() => trySet(n + 1), 150);
    };
    trySet();
  }

  return (
    <div ref={ref} className="notranslate relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-lg border border-bl-line bg-white px-2.5 py-2 text-sm font-bold text-bl-gray hover:border-bl-gray2" aria-label="言語">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
        {!compact && <span>{label}</span>}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-bl-line bg-white p-1 shadow-xl">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => pick(l.code, l.label)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${label === l.label ? "bg-bl-redsoft font-semibold text-bl-red" : "hover:bg-bl-bg"}`}>
              <span>{l.flag}</span>{l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
