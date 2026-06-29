"use client";

import { useEffect, useState } from "react";
import { DEFAULT_AI_PROMPT } from "@/lib/aiPrompt";

export default function AiSettings() {
  const [enabled, setEnabled] = useState(true);
  const [model, setModel] = useState("gpt-4o-mini");
  const [instructions, setInstructions] = useState("");
  const [keyOk, setKeyOk] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/ai-config").then((r) => r.json()).then((j) => {
      if (j.config) { setEnabled(j.config.enabled); setModel(j.config.model || "gpt-4o-mini"); setInstructions(j.config.instructions || ""); setKeyOk(!!j.keyConfigured); setLoaded(true); }
    }).catch(() => setLoaded(true));
  }, []);

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/ai-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled, model, instructions }) });
    setBusy(false);
    setMsg(r.ok ? "保存しました。" : "保存に失敗しました。");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-bl-red"><path d="M12 2a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3 3 3 0 0 1 0 6 3 3 0 0 1-3 3v1a3 3 0 0 1-6 0v-1a3 3 0 0 1-3-3 3 3 0 0 1 0-6 3 3 0 0 1 3-3V5a3 3 0 0 1 3-3z" /><path d="M9 12h.01M15 12h.01" /></svg>
        <h2 className="text-base font-black text-ink">AI設定（自動返信）</h2>
      </div>
      <p className="mb-3 text-xs text-slate-500">メッセージでAIがまず自動で応答します。スタッフが返信すると翌日までAIは停止します。各会話の「AI ON/OFF」はメッセージ画面で切り替えできます。</p>

      {!keyOk && loaded && (
        <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">⚠ サーバーに OPENAI_API_KEY が未設定です。設定するまでAIは応答しません（スタッフ対応のまま）。</div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold text-ink">
          <input type="checkbox" className="h-4 w-4 accent-bl-red" checked={enabled} disabled={!loaded} onChange={(e) => setEnabled(e.target.checked)} />
          AI自動返信を有効にする（全体）
        </label>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-xs font-bold text-slate-500">モデル</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} className="input h-8 w-40 py-0 text-sm" placeholder="gpt-4o-mini" />
        </div>
      </div>

      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-500">AIへの指示（話し方・ルールをここで自由に編集）</label>
        <button type="button" onClick={() => { if (!instructions.trim() || window.confirm("現在の内容をおすすめ文で置き換えますか？")) setInstructions(DEFAULT_AI_PROMPT); }} className="text-xs font-semibold text-bl-red hover:underline">おすすめ文を挿入</button>
      </div>
      <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={9} className="input w-full text-sm" placeholder="ここに書いた内容がそのままAIの指示になります。「おすすめ文を挿入」から始めて、口調やルールを自由に調整してください。" />
      <p className="mt-1 text-[11px] text-slate-400">※ AIの話し方・ルールはすべてこの欄で決まります（コード変更は不要）。空欄の場合はおすすめ文が使われます。<br />※ 安全のため「登録された求人データのみ使用・作り話をしない・担当者への引き継ぎ」だけはシステム側で固定です。</p>

      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={busy || !loaded} className="btn btn-navy btn-sm disabled:opacity-50">{busy ? "保存中…" : "保存"}</button>
        {msg && <span className={`text-sm font-semibold ${msg.includes("保存しました") ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>}
      </div>
    </div>
  );
}
