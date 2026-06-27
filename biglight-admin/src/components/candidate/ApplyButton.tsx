"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ApplyButton({ jobId, jobTitle, loggedIn, autoOpen }: { jobId: string; jobTitle: string; loggedIn: boolean; autoOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"form" | "sending" | "done" | "need">("form");

  useEffect(() => { if (autoOpen && loggedIn) setOpen(true); }, [autoOpen, loggedIn]);

  function start() {
    if (!loggedIn) {
      window.location.href = `/mypage?redirect=${encodeURIComponent(`/jobs/${jobId}?apply=1`)}&t=${encodeURIComponent(jobTitle)}`;
      return;
    }
    setState("form"); setOpen(true);
  }

  async function submit() {
    setState("sending");
    const res = await fetch("/api/candidate/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, note }) });
    if (res.status === 422) { setState("need"); return; }
    if (res.ok) setState("done");
    else { setState("form"); alert((await res.json().catch(() => ({}))).error || "送信に失敗しました"); }
  }

  return (
    <>
      <button onClick={start} className="mt-5 block w-full rounded-xl bg-bl-red py-3.5 text-center font-bold text-white shadow-lg hover:bg-bl-redd">この求人に応募する</button>

      {open && loggedIn && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black">応募フォーム</h3>
              <button onClick={() => setOpen(false)} className="text-bl-gray2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
            </div>

            {state === "done" ? (
              <div className="py-4 text-center">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bl-greensoft text-bl-green"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
                <p className="text-sm font-bold text-ink">応募を受け付けました。</p>
                <p className="mt-1 text-xs text-bl-gray">担当者がご連絡します。進捗はマイページで確認できます。</p>
                <Link href="/mypage" className="mt-4 inline-block rounded-xl bg-bl-red px-5 py-2.5 text-sm font-bold text-white">マイページで確認</Link>
              </div>
            ) : state === "need" ? (
              <div className="py-3">
                <p className="rounded-lg bg-bl-redsoft px-3 py-2 text-sm font-semibold text-bl-red">応募する前にプロフィールを完成してください。</p>
                <p className="mt-2 text-xs text-bl-gray">必須項目（氏名・生年月日・性別・国籍・電話番号・在留資格・メール）を入力すると応募できます。</p>
                <Link href="/mypage" className="mt-4 block rounded-xl bg-bl-red py-3 text-center text-sm font-bold text-white">プロフィールを入力する</Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-bl-gray">「<b className="text-ink">{jobTitle}</b>」に応募します。</p>
                <p className="mt-1 text-xs text-bl-gray2">プロフィール情報を確認のうえ送信してください。<Link href="/mypage" className="text-bl-red underline">プロフィールを編集</Link></p>
                <label className="mt-3 block text-xs font-bold text-bl-gray">応募メモ（任意）</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="希望条件・質問・自己PRなど" className="mt-1 w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm outline-none focus:border-bl-red" />
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-bl-line py-3 text-sm font-bold text-bl-gray">キャンセル</button>
                  <button onClick={submit} disabled={state === "sending"} className="flex-1 rounded-xl bg-bl-red py-3 text-sm font-bold text-white hover:bg-bl-redd disabled:opacity-60">{state === "sending" ? "送信中…" : "応募を送信"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
