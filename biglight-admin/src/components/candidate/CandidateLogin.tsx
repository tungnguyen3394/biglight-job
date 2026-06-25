"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { PUBLIC_BASE_URL } from "@/lib/site";

declare global {
  interface Window {
    google?: any;
    handleCandGoogle?: (resp: { credential: string }) => void;
  }
}

export default function CandidateLogin({ applyTitle, fbError }: { applyTitle?: string; fbError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(fbError ?? "");
  const [busy, setBusy] = useState(false);
  const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  // Google (JS, không popup vấn đề)
  useEffect(() => {
    window.handleCandGoogle = async (resp) => {
      setError("");
      setBusy(true);
      const res = await fetch("/api/auth/candidate/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential: resp.credential }) });
      setBusy(false);
      if (res.ok) router.refresh();
      else setError((await res.json().catch(() => ({}))).error || "Googleログインに失敗しました");
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function initGoogle() {
    if (!googleId || !window.google) return;
    window.google.accounts.id.initialize({ client_id: googleId, callback: window.handleCandGoogle });
    window.google.accounts.id.renderButton(document.getElementById("cand-gbtn"), { theme: "outline", size: "large", width: 300, text: "continue_with", shape: "pill" });
  }

  // Facebook: chuyển hướng cả trang (redirect flow) — KHÔNG popup.
  function loginFb() {
    if (!fbAppId) return;
    const redirectUri = `${PUBLIC_BASE_URL}/api/auth/candidate/facebook/callback`;
    // Chỉ xin public_profile (luôn có). Email không bắt buộc — định danh bằng Facebook ID.
    const u =
      `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(fbAppId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile&response_type=code`;
    window.location.href = u;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Script src="https://accounts.google.com/gsi/client" onLoad={initGoogle} />

      <div className="rounded-3xl border border-bl-line bg-white p-7 text-center shadow-sm">
        <Logo size={56} className="mx-auto mb-4" />
        <h1 className="text-xl font-black">無料登録・ログイン</h1>
        <p className="mt-2 text-sm text-bl-gray">FacebookまたはGoogleで、かんたんに始められます。応募状況の確認・担当者との連絡ができます。</p>
        {applyTitle && (
          <p className="mt-3 rounded-lg bg-bl-redsoft px-3 py-2 text-xs font-semibold text-bl-red">「{applyTitle}」への応募を続けるにはログインしてください。</p>
        )}

        {fbAppId && (
          <button onClick={loginFb} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-bl-fb py-3 font-bold text-white hover:bg-[#0C63D4]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
            Facebookで続ける
          </button>
        )}

        <div className="mt-3 flex justify-center"><div id="cand-gbtn" /></div>
        {!googleId && <p className="text-xs text-bl-gray2">（Googleは NEXT_PUBLIC_GOOGLE_CLIENT_ID 設定後に表示）</p>}

        {error && <p className="mt-3 text-sm font-semibold text-bl-red">{error}</p>}
        {busy && <p className="mt-3 text-sm text-bl-gray">ログイン中…</p>}

        <ul className="mt-6 space-y-2 text-left text-sm text-bl-gray">
          <li>✓ 応募の進捗をいつでも確認</li>
          <li>✓ 担当者とFacebookで直接やりとり</li>
          <li>✓ プロフィールを入れるほど良い求人が届く</li>
        </ul>
      </div>
    </div>
  );
}
