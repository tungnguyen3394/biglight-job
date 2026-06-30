"use client";

import { useEffect, useRef, useState } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import Linkify from "@/components/common/Linkify";

type Msg = {
  id: string; senderRole: string;
  originalText: string; originalLanguage: string;
  translatedText: string | null; translatedLanguage: string | null;
  createdAt: string;
  deleted?: boolean; recalled?: boolean;
};

function hhmm(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CandidateMessages({ onClose }: { onClose?: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOrig, setShowOrig] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Mobile full-screen: bám theo VisualViewport để bàn phím mở không nhảy khung,
  // ô nhập luôn nằm ngay trên bàn phím (iOS + Android). Desktop (lg) bỏ qua → dùng card.
  useEffect(() => {
    const vv = window.visualViewport;
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      const el = boxRef.current;
      if (!el) return;
      if (mq.matches) {
        el.style.height = `${vv ? vv.height : window.innerHeight}px`;
        el.style.top = `${vv ? vv.offsetTop : 0}px`;
        el.style.bottom = "auto";
      } else {
        el.style.height = "";
        el.style.top = "";
        el.style.bottom = "";
      }
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    mq.addEventListener?.("change", apply);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      mq.removeEventListener?.("change", apply);
    };
  }, []);

  async function load() {
    const r = await fetch("/api/candidate/messages");
    const j = await r.json().catch(() => ({}));
    if (r.ok) setMsgs(j.messages || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  // Điền sẵn ô nhập khi mở từ「この求人についてAIに相談」(?ask=...) — không tạo chat mới.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ask = new URLSearchParams(window.location.search).get("ask");
    if (ask) setDraft((d) => d || ask);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    const t = draft.trim();
    if (!t || sending) return;
    setSending(true);
    const r = await fetch("/api/candidate/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
    const j = await r.json().catch(() => ({}));
    setSending(false);
    if (r.ok && j.message) { setMsgs((m) => [...m, j.message, ...(j.aiMessage ? [j.aiMessage] : [])]); setDraft(""); }
  }
  function scrollEnd() { setTimeout(() => endRef.current?.scrollIntoView({ block: "end" }), 300); }
  function toggle(id: string) { setShowOrig((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  const [menu, setMenu] = useState<string | null>(null);
  async function recall(id: string) {
    setMenu(null);
    if (!window.confirm("このメッセージを取り消しますか？ / Thu hồi tin nhắn này?")) return;
    const r = await fetch("/api/candidate/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "recall" }) });
    if (r.ok) setMsgs((m) => m.map((x) => (x.id === id ? { ...x, recalled: true, originalText: "", translatedText: null } : x)));
  }

  function disp(m: Msg) {
    const mine = m.senderRole === "CANDIDATE";
    // AI đã trả lời sẵn theo ngôn ngữ ứng viên → hiện originalText.
    if (mine || m.senderRole === "AI" || showOrig.has(m.id)) return m.originalText;
    return m.translatedText ?? m.originalText;
  }
  function senderName(m: Msg) {
    if (m.senderRole === "AI") return "BIGLIGHT AI";
    if (m.senderRole === "SYSTEM") return "BIGLIGHT JOB";
    if (m.senderRole === "ADMIN" || m.senderRole === "STAFF") return "BIGLIGHT 担当";
    return "";
  }

  return (
    <div ref={boxRef} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white lg:static lg:z-auto lg:h-[72dvh] lg:max-h-[820px] lg:rounded-2xl lg:border lg:border-bl-line lg:shadow-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-bl-line px-4 py-2.5">
        {onClose && (
          <button onClick={onClose} className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-bl-gray hover:bg-bl-line lg:hidden" aria-label="戻る">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        )}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bl-red text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" /></svg>
        </div>
        <div className="min-w-0"><b className="text-sm">BIGLIGHT 担当チーム</b><div className="truncate text-[11px] text-bl-gray2">Nhập tiếng Việt / Indonesia — tự động dịch sang tiếng Nhật</div></div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-bl-bg p-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-bl-gray2">読み込み中…</div>
        ) : msgs.map((m) => {
          const mine = m.senderRole === "CANDIDATE";
          const name = senderName(m);
          const tomb = m.deleted || m.recalled;
          const translatable = !mine && !tomb && m.translatedText && m.translatedText !== m.originalText;
          const canRecall = mine && !tomb;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                {name && <div className="mb-0.5 text-[11px] font-semibold text-bl-gray2">{name}</div>}
                <div className="flex items-end gap-1">
                  {tomb ? (
                    <div className={`rounded-2xl border border-dashed px-3.5 py-2 text-sm italic text-bl-gray2 ${mine ? "border-bl-red/30 bg-bl-redsoft/30" : "border-bl-line bg-white"}`}>
                      {m.recalled ? "このメッセージは取り消されました / Đã thu hồi" : "このメッセージは削除されました / Đã bị xóa"}
                    </div>
                  ) : (
                    <div className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${mine ? "rounded-br-sm bg-bl-red text-white" : "rounded-bl-sm border border-bl-line bg-white text-ink"}`}>
                      <Linkify text={disp(m)} linkClassName={`font-semibold underline underline-offset-2 break-all ${mine ? "text-white hover:opacity-80" : "text-bl-blue hover:opacity-80"}`} />
                    </div>
                  )}
                  {canRecall && (
                    <div className="relative">
                      <button onClick={() => setMenu(menu === m.id ? null : m.id)} className="flex h-6 w-6 items-center justify-center rounded-full text-bl-gray2 hover:bg-bl-line" aria-label="操作">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
                      </button>
                      {menu === m.id && (
                        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-bl-line bg-white py-1 shadow-lg">
                          <button onClick={() => recall(m.id)} className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-bl-bg">送信取消 / Thu hồi</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!tomb && (
                  <div className={`mt-0.5 flex items-center gap-2 text-[10px] text-bl-gray2 ${mine ? "justify-end" : ""}`}>
                    <span>{hhmm(m.createdAt)}</span>
                    {translatable && (
                      <button onClick={() => toggle(m.id)} className="font-semibold text-bl-blue hover:underline">
                        {showOrig.has(m.id) ? "翻訳を見る / Xem bản dịch" : "原文を見る / Xem bản gốc"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 pb-[env(safe-area-inset-bottom)] lg:pb-0">
        <ChatComposer value={draft} onChange={setDraft} onSend={send} sending={sending} target="ja" variant="round" onFocus={scrollEnd} placeholder="メッセージを入力… / Nhập tin nhắn…" />
      </div>
    </div>
  );
}
