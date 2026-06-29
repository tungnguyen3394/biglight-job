"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONV_STATUS_LABEL, CONV_STATUS_TONE } from "@/lib/messageConstants";
import { ChatComposer } from "@/components/chat/ChatComposer";

type Conv = { id: string; candidateId: string; name: string; image: string | null; lastMessage: string | null; lastMessageAt: string | null; unread: boolean; status: keyof typeof CONV_STATUS_LABEL; staffName: string | null };
type Msg = { id: string; senderRole: string; senderId: string | null; senderName?: string | null; originalText: string; originalLanguage: string; translatedText: string | null; translatedLanguage: string | null; createdAt: string; deleted?: boolean; recalled?: boolean };
type Cand = { id: string; name: string; email: string | null; phone: string | null; nationality: string | null; japaneseLevel: string | null; image: string | null; jobs: string[] };
const STATUSES: (keyof typeof CONV_STATUS_LABEL)[] = ["WAITING", "IN_PROGRESS", "DONE"];
type Filter = "all" | "unread" | "unanswered";

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
function Icon({ d, size = 16 }: { d: React.ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}
const sortByLast = (a: Conv, b: Conv) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "");

export default function MessagesAdmin({ canReply, canManage, isAdmin, myId }: { canReply: boolean; canManage: boolean; isAdmin: boolean; myId: string }) {
  const [list, setList] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cand, setCand] = useState<Cand | null>(null);
  const [status, setStatus] = useState<keyof typeof CONV_STATUS_LABEL>("WAITING");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiPaused, setAiPaused] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [showOrig, setShowOrig] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const shownList = list.filter((c) => (filter === "unread" ? c.unread : filter === "unanswered" ? c.status === "WAITING" : true));
  const unreadCount = list.filter((c) => c.unread).length;
  const waitingCount = list.filter((c) => c.status === "WAITING").length;

  async function loadList() {
    const r = await fetch("/api/admin/messages");
    const j = await r.json().catch(() => ({}));
    if (r.ok) setList((j.conversations || []).slice().sort(sortByLast));
  }
  useEffect(() => { loadList(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [msgs]);

  async function open(id: string) {
    setActiveId(id); setMenu(null);
    setMsgs([]); setCand(null);
    const r = await fetch(`/api/admin/messages/${id}`);
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setMsgs(j.messages || []); setCand(j.candidate); setStatus(j.status); setAiEnabled(j.aiEnabled ?? true); setAiPaused(j.aiPaused ?? false); }
    setList((p) => p.map((c) => (c.id === id ? { ...c, unread: false } : c)));
  }
  function scrollEnd() { setTimeout(() => endRef.current?.scrollIntoView({ block: "end" }), 300); }

  async function send() {
    const t = draft.trim();
    if (!t || sending || !activeId) return;
    setSending(true);
    const r = await fetch(`/api/admin/messages/${activeId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
    const j = await r.json().catch(() => ({}));
    setSending(false);
    if (r.ok && j.message) {
      setMsgs((m) => [...m, j.message]); setDraft(""); setStatus("IN_PROGRESS");
      const now = new Date().toISOString();
      setList((p) => p.map((c) => (c.id === activeId ? { ...c, lastMessage: j.message.originalText as string, lastMessageAt: now, status: "IN_PROGRESS" as const } : c)).sort(sortByLast));
    } else if (j.error) { alert(j.error); }
  }
  async function toggleAi() {
    if (!activeId) return;
    const next = !aiEnabled;
    setAiEnabled(next); if (next) setAiPaused(false);
    await fetch(`/api/admin/messages/${activeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aiEnabled: next }) });
  }
  async function changeStatus(s: keyof typeof CONV_STATUS_LABEL) {
    if (!activeId) return;
    setStatus(s);
    await fetch(`/api/admin/messages/${activeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    setList((p) => p.map((c) => (c.id === activeId ? { ...c, status: s } : c)));
  }
  function toggle(id: string) { setShowOrig((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }

  async function recallMsg(id: string) {
    setMenu(null);
    if (!activeId || !window.confirm("このメッセージを取り消しますか？相手にも「取り消されました」と表示されます。")) return;
    const r = await fetch(`/api/admin/messages/${activeId}/msg/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "recall" }) });
    if (r.ok) { setMsgs((m) => m.map((x) => (x.id === id ? { ...x, recalled: true, originalText: "", translatedText: null } : x))); loadList(); }
    else alert((await r.json().catch(() => ({}))).error || "取り消しに失敗しました");
  }
  async function deleteMsg(id: string) {
    setMenu(null);
    if (!activeId || !window.confirm("このメッセージを削除しますか？")) return;
    const r = await fetch(`/api/admin/messages/${activeId}/msg/${id}`, { method: "DELETE" });
    if (r.ok) { setMsgs((m) => m.map((x) => (x.id === id ? { ...x, deleted: true, originalText: "", translatedText: null } : x))); loadList(); }
    else alert((await r.json().catch(() => ({}))).error || "削除に失敗しました");
  }
  async function deleteConversation() {
    if (!activeId || !window.confirm("この会話をすべて削除しますか？この操作は元に戻せません。")) return;
    const r = await fetch(`/api/admin/messages/${activeId}`, { method: "DELETE" });
    if (r.ok) { setList((p) => p.filter((c) => c.id !== activeId)); setActiveId(null); setMsgs([]); setCand(null); }
    else alert((await r.json().catch(() => ({}))).error || "削除に失敗しました");
  }

  function disp(m: Msg) {
    if (showOrig.has(m.id)) return m.originalText;
    // CANDIDATE/AI: gốc theo ngôn ngữ ứng viên → admin xem bản dịch tiếng Nhật.
    if (m.senderRole === "CANDIDATE" || m.senderRole === "AI") return m.translatedText ?? m.originalText;
    return m.originalText;
  }
  function roleName(m: Msg) {
    if (m.senderRole === "AI") return "BIGLIGHT AI（自動）";
    if (m.senderRole === "SYSTEM") return "システム";
    if (m.senderRole === "ADMIN" || m.senderRole === "STAFF") {
      const role = m.senderRole === "ADMIN" ? "管理者" : "スタッフ";
      return m.senderName ? `${m.senderName}（${role}）` : role;
    }
    return cand?.name ?? "応募者";
  }
  const canRecall = (m: Msg) => canManage && !m.deleted && !m.recalled && m.senderRole !== "SYSTEM" && (isAdmin || m.senderId === myId);
  const canDeleteMsg = (m: Msg) => canManage && !m.deleted && !m.recalled && m.senderRole !== "SYSTEM";

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[22px] font-black text-ink">メッセージ</h1>
        <p className="text-sm text-slate-500">応募者とのチャット（日本語で返信、応募者には自動翻訳で届きます）</p>
      </div>

      <div className="grid h-[78vh] min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[330px_1fr] xl:grid-cols-[330px_1fr_300px]">
        {/* ===== Left: conversation list (luôn hiện trên PC) ===== */}
        <div className={`min-h-0 flex-col border-r border-slate-100 ${activeId ? "hidden md:flex" : "flex"}`}>
          {/* filter tabs */}
          <div className="flex items-center gap-1 border-b border-slate-100 p-2">
            {([["all", "すべて", list.length], ["unread", "未読", unreadCount], ["unanswered", "未返信", waitingCount]] as [Filter, string, number][]).map(([k, label, n]) => (
              <button key={k} onClick={() => setFilter(k)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${filter === k ? "bg-navy text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                {label}{n > 0 && <span className={`ml-1 ${filter === k ? "text-white/80" : "text-slate-400"}`}>{n}</span>}
              </button>
            ))}
            <button onClick={loadList} title="更新" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy"><Icon d={<><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></>} size={14} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {shownList.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
                <Icon d={<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" />} size={28} />
                <span className="text-sm">{filter === "all" ? "会話がありません。" : "該当する会話がありません。"}</span>
              </div>
            ) : shownList.map((c) => (
              <button key={c.id} onClick={() => open(c.id)} className={`flex w-full items-start gap-3 border-b border-slate-50 px-3 py-3 text-left transition hover:bg-slate-50 ${activeId === c.id ? "bg-bl-redsoft/40" : ""}`}>
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
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${CONV_STATUS_TONE[c.status]}`}>{CONV_STATUS_LABEL[c.status]}</span>
                    {c.staffName && <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Icon d={<><circle cx="12" cy="8" r="3.2" /><path d="M5 21c0-4 3-6 7-6s7 2 7 6" /></>} size={10} />{c.staffName}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ===== Center: chat ===== */}
        <div className={`min-h-0 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">左の一覧から会話を選択してください。</div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                <button onClick={() => setActiveId(null)} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-navy md:hidden" aria-label="会話一覧"><Icon d={<path d="m15 18-6-6 6-6" />} size={18} />会話一覧</button>
                {cand && <Avatar name={cand.name} image={cand.image} size={8} />}
                <b className="truncate text-sm text-ink">{cand?.name ?? "…"}</b>
                {canReply && (
                  <button onClick={toggleAi} className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold ${aiPaused ? "bg-amber-100 text-amber-700" : aiEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`} title={aiPaused ? "スタッフ返信のため明日までAIを一時停止中（クリックで今すぐON）" : aiEnabled ? "AI自動返信：ON（クリックでOFF）" : "AI自動返信：OFF（クリックでON）"}>
                    AI {aiPaused ? "一時停止" : aiEnabled ? "ON" : "OFF"}
                  </button>
                )}
                {canReply ? (
                  <select value={status} onChange={(e) => changeStatus(e.target.value as keyof typeof CONV_STATUS_LABEL)} className={`ml-auto rounded-full border-0 px-2 py-1 text-xs font-semibold outline-none ${CONV_STATUS_TONE[status]}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{CONV_STATUS_LABEL[s]}</option>)}
                  </select>
                ) : (
                  <span className={`ml-auto rounded-full px-2 py-1 text-xs font-semibold ${CONV_STATUS_TONE[status]}`}>{CONV_STATUS_LABEL[status]}</span>
                )}
                {canManage && (
                  <button onClick={deleteConversation} title="会話削除" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                    <Icon d={<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />} size={15} />
                  </button>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" onClick={() => setMenu(null)}>
                {msgs.map((m) => {
                  const left = m.senderRole === "CANDIDATE";
                  const tomb = m.deleted || m.recalled;
                  const translatable = left && !tomb && m.translatedText && m.translatedText !== m.originalText;
                  const hasMenu = canRecall(m) || canDeleteMsg(m);
                  return (
                    <div key={m.id} className={`flex ${left ? "justify-start" : "justify-end"}`}>
                      <div className="max-w-[80%]">
                        <div className="mb-0.5 text-[11px] font-semibold text-slate-400">{roleName(m)}</div>
                        <div className="flex items-end gap-1">
                          {tomb ? (
                            <div className={`rounded-2xl border border-dashed px-3.5 py-2 text-sm italic text-slate-400 ${left ? "border-slate-200 bg-white" : "border-red-200 bg-red-50/40"}`}>
                              {m.recalled ? "このメッセージは取り消されました" : "このメッセージは削除されました"}
                            </div>
                          ) : (
                            <div className={`relative whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${left ? "rounded-bl-sm border border-slate-200 bg-white text-ink" : "rounded-br-sm bg-bl-red text-white"}`}>{disp(m)}</div>
                          )}
                          {hasMenu && (
                            <div className="relative">
                              <button onClick={(e) => { e.stopPropagation(); setMenu(menu === m.id ? null : m.id); }} className="flex h-6 w-6 items-center justify-center rounded-full text-slate-300 hover:bg-slate-200 hover:text-slate-600" aria-label="操作">
                                <Icon d={<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>} size={16} />
                              </button>
                              {menu === m.id && (
                                <div className={`absolute z-20 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${left ? "left-0" : "right-0"}`} onClick={(e) => e.stopPropagation()}>
                                  {canRecall(m) && <button onClick={() => recallMsg(m.id)} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">送信取消（取り消し）</button>}
                                  {canDeleteMsg(m) && <button onClick={() => deleteMsg(m.id)} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">削除</button>}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {!tomb && (
                          <div className={`mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 ${left ? "" : "justify-end"}`}>
                            <span>{hhmm(m.createdAt)}</span>
                            {translatable && <button onClick={() => toggle(m.id)} className="font-semibold text-brand-blue hover:underline">{showOrig.has(m.id) ? "翻訳を見る" : "原文を見る"}</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {canReply ? (
                <ChatComposer value={draft} onChange={setDraft} onSend={send} sending={sending} target="ja" variant="button" onFocus={scrollEnd} placeholder="返信を入力…（日本語以外は自動で日本語に翻訳されます）" />
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
