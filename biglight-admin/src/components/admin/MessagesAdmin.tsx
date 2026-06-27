"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONV_STATUS_LABEL, CONV_STATUS_TONE } from "@/lib/messageConstants";
import { ChatComposer } from "@/components/chat/ChatComposer";

type Conv = { id: string; candidateId: string; name: string; image: string | null; lastMessage: string | null; lastMessageAt: string | null; unread: boolean; status: keyof typeof CONV_STATUS_LABEL };
type Msg = { id: string; senderRole: string; senderName?: string | null; originalText: string; originalLanguage: string; translatedText: string | null; translatedLanguage: string | null; createdAt: string };
type Cand = { id: string; name: string; email: string | null; phone: string | null; nationality: string | null; japaneseLevel: string | null; image: string | null; jobs: string[] };
const STATUSES: (keyof typeof CONV_STATUS_LABEL)[] = ["WAITING", "IN_PROGRESS", "DONE"];

function hhmm(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
const AV_SIZE: Record<number, string> = { 8: "h-8 w-8", 9: "h-9 w-9", 10: "h-10 w-10", 16: "h-16 w-16" };
function Avatar({ name, image, size = 9 }: { name: string; image: string | null; size?: number }) {
  const cls = AV_SIZE[size] ?? "h-9 w-9";
  if (image) return <img src={image} alt="" className={`${cls} shrink-0 rounded-full object-cover`} />;
  return <span className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy`}>{(name || "?").charAt(0)}</span>;
}

export default function MessagesAdmin({ canReply, canDelete }: { canReply: boolean; canDelete: boolean }) {
  const [list, setList] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cand, setCand] = useState<Cand | null>(null);
  const [status, setStatus] = useState<keyof typeof CONV_STATUS_LABEL>("WAITING");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [showOrig, setShowOrig] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  // Lọc "chỉ chưa trả lời" = 返信待ち (WAITING). Danh sách đã sắp tin mới nhất lên trên (API order desc).
  const shownList = unansweredOnly ? list.filter((c) => c.status === "WAITING") : list;

  async function loadList() {
    const r = await fetch("/api/admin/messages");
    const j = await r.json().catch(() => ({}));
    if (r.ok) setList(j.conversations || []);
  }
  useEffect(() => { loadList(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [msgs]);

  async function open(id: string) {
    setActiveId(id);
    setMsgs([]); setCand(null);
    const r = await fetch(`/api/admin/messages/${id}`);
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setMsgs(j.messages || []); setCand(j.candidate); setStatus(j.status); }
    setList((p) => p.map((c) => (c.id === id ? { ...c, unread: false } : c)));
  }
  async function send() {
    const t = draft.trim();
    if (!t || sending || !activeId) return;
    setSending(true);
    const r = await fetch(`/api/admin/messages/${activeId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
    const j = await r.json().catch(() => ({}));
    setSending(false);
    if (r.ok && j.message) {
      setMsgs((m) => [...m, j.message]); setDraft(""); setStatus("IN_PROGRESS");
      setList((p) => p.map((c) => (c.id === activeId ? { ...c, lastMessage: t, lastMessageAt: new Date().toISOString(), status: "IN_PROGRESS" } : c)));
    } else if (j.error) { alert(j.error); }
  }
  async function changeStatus(s: keyof typeof CONV_STATUS_LABEL) {
    if (!activeId) return;
    setStatus(s);
    await fetch(`/api/admin/messages/${activeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    setList((p) => p.map((c) => (c.id === activeId ? { ...c, status: s } : c)));
  }
  function toggle(id: string) { setShowOrig((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }

  async function deleteMessage(id: string) {
    if (!activeId || !window.confirm("このメッセージを削除しますか？")) return;
    const r = await fetch(`/api/admin/messages/${activeId}/msg/${id}`, { method: "DELETE" });
    if (r.ok) setMsgs((m) => m.filter((x) => x.id !== id));
  }
  async function deleteConversation() {
    if (!activeId || !window.confirm("この会話をすべて削除しますか？この操作は元に戻せません。")) return;
    const r = await fetch(`/api/admin/messages/${activeId}`, { method: "DELETE" });
    if (r.ok) { setList((p) => p.filter((c) => c.id !== activeId)); setActiveId(null); setMsgs([]); setCand(null); }
  }

  // Admin đọc tiếng Nhật: tin ứng viên → bản dịch ja; còn lại → nguyên văn ja.
  function disp(m: Msg) {
    if (showOrig.has(m.id)) return m.originalText;
    if (m.senderRole === "CANDIDATE") return m.translatedText ?? m.originalText;
    return m.originalText;
  }
  function roleName(m: Msg) {
    if (m.senderRole === "SYSTEM") return "システム";
    if (m.senderRole === "ADMIN" || m.senderRole === "STAFF") {
      const role = m.senderRole === "ADMIN" ? "管理者" : "スタッフ";
      return m.senderName ? `${m.senderName}（${role}）` : role;
    }
    return cand?.name ?? "応募者";
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[22px] font-black text-ink">メッセージ</h1>
        <p className="text-sm text-slate-500">応募者とのチャット（日本語で返信、応募者には自動翻訳で届きます）</p>
      </div>

      <div className="grid h-[74vh] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_290px]">
        {/* ===== Left: conversation list ===== */}
        <div className={`flex flex-col border-r border-slate-100 ${activeId ? "hidden md:flex" : "flex"}`}>
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">会話一覧</span>
              <button onClick={loadList} className="text-xs font-semibold text-slate-400 hover:text-bl-red" title="更新">更新</button>
            </div>
            <label className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500">
              <input type="checkbox" checked={unansweredOnly} onChange={(e) => setUnansweredOnly(e.target.checked)} className="h-3.5 w-3.5 accent-bl-red" />
              未返信のみ表示
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {shownList.length === 0 && <div className="p-6 text-center text-sm text-slate-400">会話がありません。</div>}
            {shownList.map((c) => (
              <button key={c.id} onClick={() => open(c.id)} className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${activeId === c.id ? "bg-bl-redsoft/40" : ""}`}>
                <Avatar name={c.name} image={c.image} size={10} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink">{c.name}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-slate-400">{hhmm(c.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs text-slate-500">{c.lastMessage ?? "—"}</span>
                    {c.unread && <span className="ml-auto shrink-0 rounded-full bg-bl-red px-1.5 py-0.5 text-[9px] font-bold text-white">未読</span>}
                  </div>
                  <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${CONV_STATUS_TONE[c.status]}`}>{CONV_STATUS_LABEL[c.status]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ===== Center: chat ===== */}
        <div className={`flex flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">左の一覧から会話を選択してください。</div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
                <button onClick={() => setActiveId(null)} className="md:hidden" aria-label="戻る"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                {cand && <Avatar name={cand.name} image={cand.image} size={8} />}
                <b className="text-sm text-ink">{cand?.name ?? "…"}</b>
                {canReply ? (
                  <select value={status} onChange={(e) => changeStatus(e.target.value as keyof typeof CONV_STATUS_LABEL)} className={`ml-auto rounded-full border-0 px-2 py-1 text-xs font-semibold outline-none ${CONV_STATUS_TONE[status]}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{CONV_STATUS_LABEL[s]}</option>)}
                  </select>
                ) : (
                  <span className={`ml-auto rounded-full px-2 py-1 text-xs font-semibold ${CONV_STATUS_TONE[status]}`}>{CONV_STATUS_LABEL[status]}</span>
                )}
                {canDelete && (
                  <button onClick={deleteConversation} title="会話を削除" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {msgs.map((m) => {
                  const left = m.senderRole === "CANDIDATE";
                  const translatable = left && m.translatedText && m.translatedText !== m.originalText;
                  return (
                    <div key={m.id} className={`flex ${left ? "justify-start" : "justify-end"}`}>
                      <div className="max-w-[78%]">
                        <div className="mb-0.5 text-[11px] font-semibold text-slate-400">{roleName(m)}</div>
                        <div className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${left ? "rounded-bl-sm border border-slate-200 bg-white text-ink" : "rounded-br-sm bg-bl-red text-white"}`}>{disp(m)}</div>
                        <div className={`mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 ${left ? "" : "justify-end"}`}>
                          <span>{hhmm(m.createdAt)}</span>
                          {translatable && <button onClick={() => toggle(m.id)} className="font-semibold text-brand-blue hover:underline">{showOrig.has(m.id) ? "翻訳を見る" : "原文を見る"}</button>}
                          {canDelete && <button onClick={() => deleteMessage(m.id)} className="font-semibold text-slate-300 hover:text-red-500">削除</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {canReply ? (
                <ChatComposer value={draft} onChange={setDraft} onSend={send} sending={sending} target="ja" variant="button" placeholder="返信を入力…（日本語以外は自動で日本語に翻訳されます）" />
              ) : (
                <div className="border-t border-slate-100 p-3 text-center text-xs text-slate-400">閲覧のみ（返信権限がありません）</div>
              )}
            </>
          )}
        </div>

        {/* ===== Right: candidate info ===== */}
        <div className="hidden flex-col border-l border-slate-100 xl:flex">
          {cand ? (
            <div className="overflow-y-auto p-4">
              <div className="flex flex-col items-center text-center">
                <Avatar name={cand.name} image={cand.image} size={16} />
                <b className="mt-2 text-sm text-ink">{cand.name}</b>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Info label="メール" value={cand.email} />
                <Info label="電話番号" value={cand.phone} />
                <Info label="国籍" value={cand.nationality} />
                <Info label="日本語" value={cand.japaneseLevel} />
                <div>
                  <dt className="text-xs text-slate-400">応募した求人</dt>
                  <dd className="mt-1 space-y-1">
                    {cand.jobs.length ? cand.jobs.map((j, i) => <div key={i} className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-ink">{j}</div>) : <span className="text-xs text-slate-400">なし</span>}
                  </dd>
                </div>
              </dl>
              <Link href={`/admin/candidates/${cand.id}`} className="btn btn-ghost btn-sm mt-4 w-full border border-slate-200">応募者詳細を見る</Link>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-xs text-slate-400">応募者情報</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-xs text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{value || "—"}</dd>
    </div>
  );
}
