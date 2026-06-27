"use client";

import { useEffect, useRef, useState } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";

type Msg = {
  id: string; senderRole: string;
  originalText: string; originalLanguage: string;
  translatedText: string | null; translatedLanguage: string | null;
  createdAt: string;
};

function hhmm(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CandidateMessages() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOrig, setShowOrig] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    const r = await fetch("/api/candidate/messages");
    const j = await r.json().catch(() => ({}));
    if (r.ok) setMsgs(j.messages || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    const t = draft.trim();
    if (!t || sending) return;
    setSending(true);
    const r = await fetch("/api/candidate/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
    const j = await r.json().catch(() => ({}));
    setSending(false);
    if (r.ok && j.message) { setMsgs((m) => [...m, j.message]); setDraft(""); }
  }
  function scrollEnd() { setTimeout(() => endRef.current?.scrollIntoView({ block: "end" }), 300); }
  function toggle(id: string) { setShowOrig((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }

  function disp(m: Msg) {
    const mine = m.senderRole === "CANDIDATE";
    if (mine || showOrig.has(m.id)) return m.originalText;
    return m.translatedText ?? m.originalText;
  }
  function senderName(m: Msg) {
    if (m.senderRole === "SYSTEM") return "BIGLIGHT JOB";
    if (m.senderRole === "ADMIN" || m.senderRole === "STAFF") return "BIGLIGHT 担当";
    return "";
  }

  return (
    <div className="flex h-[72dvh] min-h-[460px] max-h-[820px] flex-col overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-bl-line px-4 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bl-red text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" /></svg>
        </div>
        <div className="min-w-0"><b className="text-sm">BIGLIGHT 担当チーム</b><div className="truncate text-[11px] text-bl-gray2">Nhập tiếng Việt / Indonesia — tự động dịch sang tiếng Nhật</div></div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-bl-bg p-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-bl-gray2">読み込み中…</div>
        ) : msgs.map((m) => {
          const mine = m.senderRole === "CANDIDATE";
          const name = senderName(m);
          const translatable = !mine && m.translatedText && m.translatedText !== m.originalText;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                {name && <div className="mb-0.5 text-[11px] font-semibold text-bl-gray2">{name}</div>}
                <div className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${mine ? "rounded-br-sm bg-bl-red text-white" : "rounded-bl-sm border border-bl-line bg-white text-ink"}`}>
                  {disp(m)}
                </div>
                <div className={`mt-0.5 flex items-center gap-2 text-[10px] text-bl-gray2 ${mine ? "justify-end" : ""}`}>
                  <span>{hhmm(m.createdAt)}</span>
                  {translatable && (
                    <button onClick={() => toggle(m.id)} className="font-semibold text-bl-blue hover:underline">
                      {showOrig.has(m.id) ? "翻訳を見る / Xem bản dịch" : "原文を見る / Xem bản gốc"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <ChatComposer value={draft} onChange={setDraft} onSend={send} sending={sending} target="ja" variant="round" onFocus={scrollEnd} placeholder="メッセージを入力… / Nhập tin nhắn…" />
    </div>
  );
}
