"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLoginModal } from "./useLoginModal";

export function ApplyButton({ jobId, jobTitle, loggedIn, autoOpen, variant = "full" }: { jobId: string; jobTitle: string; loggedIn: boolean; autoOpen?: boolean; variant?: "full" | "pill" }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"form" | "sending" | "done" | "need">("form");
  const [agreed, setAgreed] = useState(false);
  // Chưa đăng nhập → mở modal đăng ký; sau khi đăng ký xong quay lại trang này với apply=1 để mở xác nhận.
  const { onRegister, modal } = useLoginModal(`/jobs/${jobId}?apply=1`);

  useEffect(() => { if (autoOpen && loggedIn) setOpen(true); }, [autoOpen, loggedIn]);

  function start() {
    if (!loggedIn) { onRegister(); return; }
    setState("form"); setOpen(true);
  }

  async function submit() {
    setState("sending");
    const res = await fetch("/api/candidate/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
    if (res.status === 422) { setState("need"); return; }
    if (res.ok) setState("done");
    else { setState("form"); alert((await res.json().catch(() => ({}))).error || "送信に失敗しました"); }
  }

  return (
    <>
      {variant === "pill" ? (
        <button onClick={start} aria-label="この求人に応募する" className="flex items-center gap-1.5 rounded-full bg-bl-red px-3.5 py-1.5 text-xs font-black text-white shadow-md transition hover:bg-bl-redd active:scale-95">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
          応募
        </button>
      ) : (
        <button onClick={start} className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-bl-red to-bl-redd py-4 text-center text-base font-black text-white shadow-lg shadow-bl-red/30 transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
          この求人に応募する
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      )}

      {open && loggedIn && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black">応募の確認</h3>
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
                <p className="text-sm text-bl-gray">この求人に応募しますか？</p>
                <p className="mt-1 text-[15px] font-bold text-ink">「{jobTitle}」</p>
                <p className="mt-1 text-xs text-bl-gray2">登録済みのプロフィール情報で応募します。</p>
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-bl-gray">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 flex-none accent-bl-red" />
                  <span><a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-bl-red underline">プライバシーポリシー</a>に同意します</span>
                </label>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-bl-line py-3 text-sm font-bold text-bl-gray">キャンセル</button>
                  <button onClick={submit} disabled={state === "sending" || !agreed} className="flex-1 rounded-xl bg-bl-red py-3 text-sm font-bold text-white hover:bg-bl-redd disabled:opacity-50">{state === "sending" ? "送信中…" : "応募する"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modal}
    </>
  );
}
