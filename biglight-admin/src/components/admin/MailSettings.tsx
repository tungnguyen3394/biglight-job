"use client";

import { useState } from "react";
import { MAIL_GAS_SCRIPT } from "@/lib/mailGas";

export default function MailSettings({ initialUrl, canSendMail }: { initialUrl: string; canSendMail: boolean }) {
  const [url, setUrl] = useState(initialUrl);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function save() {
    setSaving(true); setMsg("");
    const r = await fetch("/api/admin/mail-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gasUrl: url }) });
    const j = await r.json().catch(() => ({}));
    setSaving(false);
    setMsg(r.ok ? "保存しました。" : (j.error || "保存に失敗しました。"));
  }
  function copy() { navigator.clipboard?.writeText(MAIL_GAS_SCRIPT).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <h1 className="text-[22px] font-black text-ink">メール設定（Google Apps Script）</h1>
        <p className="text-sm text-slate-500">メールは<b>あなた自身のGmail</b>から送信されます。下記はあなた専用のGAS設定です。</p>
      </div>

      <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${canSendMail ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        {canSendMail
          ? <span className="inline-flex items-center gap-2 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />メール送信が許可されています。GAS URLを登録すると送信できます。</span>
          : <span className="inline-flex items-center gap-2 text-amber-700"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />メール送信はまだ許可されていません（Adminに「ユーザー管理」で許可を依頼してください）。</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ① Script */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-black text-ink">① GASスクリプト（コピーしてGASに貼る）</h2>
            <button onClick={copy} className="btn btn-ghost btn-sm gap-1">{copied ? "コピーしました" : "コピー"}</button>
          </div>
          <pre className="max-h-72 overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100"><code>{MAIL_GAS_SCRIPT}</code></pre>
        </div>

        {/* ② URL */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-black text-ink">② 自分のGAS デプロイURL を入力</h2>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" className="input w-full" />
          <div className="mt-3 flex items-center gap-2">
            <button onClick={save} disabled={saving} className="btn btn-navy disabled:opacity-50">{saving ? "保存中…" : "保存"}</button>
            {msg && <span className={`text-sm font-semibold ${msg.includes("保存しました") ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <p className="mb-1 font-bold text-slate-600">設定手順:</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li><a href="https://script.google.com" target="_blank" rel="noreferrer" className="font-semibold text-brand-blue underline">script.google.com</a> で新規プロジェクト作成</li>
              <li>左の①コードを貼り付けて保存（Ctrl+S）</li>
              <li>「デプロイ」→「新しいデプロイ」</li>
              <li>種類「ウェブアプリ」/ 実行者「自分」/ アクセス「全員」</li>
              <li>表示されたURL（末尾 /exec）を上の欄に貼り付けて保存</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
