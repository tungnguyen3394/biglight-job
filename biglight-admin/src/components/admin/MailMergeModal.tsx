"use client";

import { useEffect, useRef, useState } from "react";
import { renderTemplate, tagValuesFor, type MergeScope, type MergeField, type MergeRecipient } from "@/lib/mailMerge";

type Prepared = {
  gasUrl: string; secret: string; replyTo: string; name: string; staffEmail: string;
  fields: MergeField[]; recipients: MergeRecipient[];
};
type Template = { id: string; name: string; subject: string; body: string; emptyMode: string };
type SendStatus = "sent" | "failed";
type LogRow = { id: string; subject: string; sentByName: string; total: number; sentCount: number; failedCount: number; recipients: { name?: string; email: string; status: string }[]; createdAt: string };

export function MailMergeModal({ scope, ids, onClose }: { scope: MergeScope; ids: string[]; onClose: () => void }) {
  const [data, setData] = useState<Prepared | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTab] = useState<"compose" | "history">("compose");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emptyMode, setEmptyMode] = useState<"blank" | "placeholder">("placeholder");
  const [previewIdx, setPreviewIdx] = useState(0);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [tplName, setTplName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastFocus = useRef<"subject" | "body">("body");

  // tải dữ liệu chuẩn bị (field tự DB + người nhận) + template
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/mail-merge/prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, ids }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setLoadErr(j.error || "読み込みに失敗しました。"); return; }
      setData(j); setTestEmail(j.staffEmail || "");
    })();
    fetch(`/api/admin/mail-merge/templates?scope=${scope}`).then((r) => r.json()).then((j) => setTemplates(j.templates || [])).catch(() => {});
  }, [scope, ids]);

  function loadLogs() {
    fetch(`/api/admin/mail-merge/logs?scope=${scope}`).then((r) => r.json()).then((j) => setLogs(j.logs || [])).catch(() => {});
  }

  // chèn {{tag}} vào đúng vị trí con trỏ của ô vừa focus (件名 hoặc 本文)
  function insertTag(tag: string) {
    const t = `{{${tag}}}`;
    const which = lastFocus.current;
    const el = which === "subject" ? subjectRef.current : bodyRef.current;
    const cur = which === "subject" ? subject : body;
    const start = el?.selectionStart ?? cur.length;
    const end = el?.selectionEnd ?? start;
    const next = cur.slice(0, start) + t + cur.slice(end);
    if (which === "subject") setSubject(next); else setBody(next);
    requestAnimationFrame(() => { el?.focus(); const pos = start + t.length; el?.setSelectionRange(pos, pos); });
  }

  const recips = data?.recipients ?? [];
  const fields = data?.fields ?? [];
  const cur = recips[previewIdx];
  const previewSubject = cur ? renderTemplate(subject, tagValuesFor(fields, cur), emptyMode) : subject;
  const previewBody = cur ? renderTemplate(body, tagValuesFor(fields, cur), emptyMode) : body;

  async function gasSend(to: string, subj: string, bdy: string) {
    await fetch(data!.gasUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ secret: data!.secret, to: [to], subject: subj, body: bdy, replyTo: data!.replyTo, name: data!.name }) });
  }

  async function testSend() {
    if (!data || !testEmail.trim()) return;
    setTestMsg("");
    const tv = cur ? tagValuesFor(fields, cur) : {};
    try {
      await gasSend(testEmail.trim(), `[テスト] ${renderTemplate(subject, tv, emptyMode)}`, renderTemplate(body, tv, emptyMode));
      setTestMsg(`${testEmail} にテスト送信しました。`);
    } catch { setTestMsg("テスト送信に失敗しました。"); }
  }

  async function doSend() {
    if (!data || sending) return;
    setSending(true);
    const results: { id: string; name: string; email: string; status: SendStatus }[] = [];
    for (const r of recips) {
      const tv = tagValuesFor(fields, r);
      let status: SendStatus = "sent";
      try { await gasSend(r.email, renderTemplate(subject, tv, emptyMode), renderTemplate(body, tv, emptyMode)); }
      catch { status = "failed"; }
      results.push({ id: r.id, name: r.name, email: r.email, status });
    }
    await fetch("/api/admin/mail-merge/logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, subject, body, recipients: results }) }).catch(() => {});
    setSending(false); setConfirming(false);
    setResult({ sent: results.filter((r) => r.status === "sent").length, failed: results.filter((r) => r.status === "failed").length });
  }

  async function saveTemplate() {
    if (!tplName.trim()) return;
    const r = await fetch("/api/admin/mail-merge/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, name: tplName.trim(), subject, body, emptyMode }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setTemplates((p) => [j.template, ...p]); setTplName(""); }
  }
  function loadTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject); setBody(t.body); setEmptyMode(t.emptyMode === "placeholder" ? "placeholder" : "blank");
  }

  const scopeLabel = scope === "company" ? "企業" : "応募者";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6" onClick={() => !sending && onClose()}>
      <div className="my-2 w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-black text-ink">メール一括送信（差し込み）— {scopeLabel}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-ink"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        {/* tabs */}
        <div className="flex gap-1 border-b border-slate-100 px-5 pt-2">
          <button onClick={() => setTab("compose")} className={`rounded-t-lg px-3 py-2 text-sm font-bold ${tab === "compose" ? "bg-slate-100 text-ink" : "text-slate-500"}`}>作成</button>
          <button onClick={() => { setTab("history"); loadLogs(); }} className={`rounded-t-lg px-3 py-2 text-sm font-bold ${tab === "history" ? "bg-slate-100 text-ink" : "text-slate-500"}`}>送信履歴</button>
        </div>

        {loadErr ? (
          <div className="p-6 text-sm font-semibold text-red-600">{loadErr}</div>
        ) : !data ? (
          <div className="p-10 text-center text-sm text-slate-400">読み込み中…</div>
        ) : result ? (
          <div className="p-8 text-center">
            <p className="text-lg font-black text-ink">送信リクエストを実行しました</p>
            <p className="mt-2 text-sm text-slate-600">リクエスト送信 <b className="text-emerald-600">{result.sent}</b> 件 ・ 接続エラー <b className="text-red-600">{result.failed}</b> 件</p>
            <p className="mx-auto mt-2 max-w-sm rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">⚠「リクエスト送信」は実際の到達を保証しません。各自Gmailの「送信済み」で必ずご確認ください。</p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => { setResult(null); setTab("history"); loadLogs(); }} className="btn btn-ghost">送信履歴を見る</button>
              <button onClick={onClose} className="btn btn-navy">閉じる</button>
            </div>
          </div>
        ) : tab === "history" ? (
          <div className="max-h-[70vh] overflow-y-auto p-5">
            {logs.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">送信履歴はまだありません。</p> : (
              <div className="space-y-3">
                {logs.map((l) => (
                  <div key={l.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-bold text-ink">{l.subject || "（件名なし）"}</span>
                      <span className="text-xs text-slate-400">{new Date(l.createdAt).toLocaleString("ja-JP")} ・ {l.sentByName}</span>
                    </div>
                    <div className="mt-1 text-xs"><span className="font-bold text-emerald-600">送信 {l.sentCount}</span> / <span className="font-bold text-red-600">失敗 {l.failedCount}</span> / 全 {l.total} 件</div>
                    <details className="mt-1"><summary className="cursor-pointer text-xs font-semibold text-bl-red">宛先一覧</summary>
                      <div className="mt-1 space-y-0.5">
                        {l.recipients.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600"><span className={`inline-block h-1.5 w-1.5 rounded-full ${r.status === "sent" ? "bg-emerald-500" : r.status === "failed" ? "bg-red-500" : "bg-slate-300"}`} />{r.name || ""} <span className="text-slate-400">{r.email}</span></div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[72vh] overflow-y-auto p-5">
            {/* template */}
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2.5">
              <span className="text-xs font-bold text-slate-500">テンプレート</span>
              <select onChange={(e) => { if (e.target.value) loadTemplate(e.target.value); }} className="input h-8 w-auto py-0 text-sm" defaultValue="">
                <option value="">選択して読み込み…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <span className="mx-1 text-slate-300">|</span>
              <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="保存名" className="input h-8 w-32 py-0 text-sm" />
              <button onClick={saveTemplate} disabled={!tplName.trim()} className="btn btn-ghost btn-sm disabled:opacity-40">現在の内容を保存</button>
            </div>

            {/* insert field + empty mode */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <details className="relative">
                <summary className="btn btn-navy btn-sm cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  差し込みフィールド
                </summary>
                <div className="absolute left-0 z-30 mt-1 max-h-72 w-72 max-w-[90vw] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <p className="px-1 pb-1 text-[10px] text-slate-400">クリックでカーソル位置に挿入（{scopeLabel}DBの項目のみ）</p>
                  {fields.map((f) => (
                    <button key={f.tag} onClick={() => insertTag(f.tag)} className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-slate-50">
                      <span className="font-semibold text-ink">{f.label}</span>
                      <span className="font-mono text-[10px] text-bl-red">{`{{${f.tag}}}`}</span>
                    </button>
                  ))}
                </div>
              </details>
              <span className="text-xs font-bold text-slate-500">空欄の表示：</span>
              <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-bold">
                <button onClick={() => setEmptyMode("blank")} className={`px-2.5 py-1 ${emptyMode === "blank" ? "bg-ink text-white" : "bg-white text-slate-500"}`}>空欄</button>
                <button onClick={() => setEmptyMode("placeholder")} className={`px-2.5 py-1 ${emptyMode === "placeholder" ? "bg-ink text-white" : "bg-white text-slate-500"}`}>未入力</button>
              </div>
            </div>

            {/* subject + body */}
            <label className="mb-1 block text-xs font-bold text-slate-500">件名</label>
            <input ref={subjectRef} onFocus={() => (lastFocus.current = "subject")} value={subject} onChange={(e) => setSubject(e.target.value)} className="input mb-3 w-full" placeholder="件名（{{name}} 様 などの差し込み可）" />
            <label className="mb-1 block text-xs font-bold text-slate-500">本文</label>
            <textarea ref={bodyRef} onFocus={() => (lastFocus.current = "body")} value={body} onChange={(e) => setBody(e.target.value)} rows={7} className="input w-full" placeholder="本文（差し込みフィールドを挿入できます）" />

            {/* recipients */}
            <div className="mt-4">
              <div className="mb-1 text-xs font-bold text-slate-500">宛先（重複メール除外済み）：{recips.length} 件</div>
              <div className="max-h-24 overflow-y-auto rounded-lg border border-slate-100 p-2 text-xs text-slate-600">
                {recips.map((r, i) => <span key={r.id} className="mr-2 inline-block">{i + 1}. {r.name}<span className="text-slate-400">（{r.email}）</span></span>)}
              </div>
            </div>

            {/* preview */}
            <div className="mt-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                <span className="text-xs font-bold text-slate-500">プレビュー（受信者ごと）</span>
                <select value={previewIdx} onChange={(e) => setPreviewIdx(Number(e.target.value))} className="input h-7 w-auto py-0 text-xs">
                  {recips.map((r, i) => <option key={r.id} value={i}>{r.name}（{r.email}）</option>)}
                </select>
              </div>
              <div className="space-y-1 p-3">
                <div className="text-xs text-slate-400">件名</div>
                <div className="text-sm font-bold text-ink">{previewSubject || <span className="text-slate-300">（空）</span>}</div>
                <div className="mt-2 text-xs text-slate-400">本文</div>
                <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">{previewBody || <span className="text-slate-300">（空）</span>}</div>
              </div>
            </div>

            {/* test send */}
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 p-2.5">
              <span className="text-xs font-bold text-amber-700">テスト送信</span>
              <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="input h-8 w-56 max-w-[60vw] py-0 text-sm" placeholder="送信先メール" />
              <button onClick={testSend} disabled={!testEmail.trim() || !body.trim()} className="btn btn-ghost btn-sm disabled:opacity-40">テスト送信</button>
              {testMsg && <span className="text-xs font-semibold text-emerald-700">{testMsg}</span>}
            </div>

            {/* confirm + send */}
            {confirming && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                {recips.length} 件にそれぞれ差し込み送信します。送信後は取り消せません。よろしいですか？
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="btn btn-ghost">キャンセル</button>
              {confirming ? (
                <>
                  <button onClick={() => setConfirming(false)} disabled={sending} className="btn btn-ghost">戻る</button>
                  <button onClick={doSend} disabled={sending} className="btn btn-navy disabled:opacity-50">{sending ? `送信中…` : "はい、送信する"}</button>
                </>
              ) : (
                <button onClick={() => setConfirming(true)} disabled={!subject.trim() || !body.trim() || recips.length === 0} className="btn btn-navy disabled:opacity-50">送信する（{recips.length}件）</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
