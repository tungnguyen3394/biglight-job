"use client";

import { useState } from "react";
import Logo from "./Logo";
import { PUBLIC_BASE_URL } from "@/lib/site";
import InAppBrowserNotice from "@/components/common/InAppBrowserNotice";
import { isInAppBrowser, openExternalBrowser } from "@/lib/webview";
import { setCookieConsent } from "@/lib/cookieConsent";

const BENEFITS = [
  "応募状況をいつでも確認できます",
  "プロフィールを保存できます",
  "担当者と直接やりとりできます",
  "あなたに合う求人が届きます",
];

export default function CandidateLogin({ applyTitle, fbError, redirect = "/mypage" }: { applyTitle?: string; fbError?: string; redirect?: string }) {
  const [error] = useState(fbError ?? "");
  const [agreed, setAgreed] = useState(false);
  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const dest = redirect.startsWith("/") ? redirect : "/mypage";
  const googleHref = `/api/auth/candidate/google/start?redirect=${encodeURIComponent(dest)}`;

  // Trong webview (app FB/Zalo...) Google chặn OAuth → mở trang này bằng Chrome/Safari trước.
  function onGoogleClick(e: React.MouseEvent) {
    if (!agreed) { e.preventDefault(); return; }
    setCookieConsent();
    if (isInAppBrowser()) {
      e.preventDefault();
      openExternalBrowser(window.location.href);
    }
  }

  function loginFb() {
    if (!fbAppId || !agreed) return;
    setCookieConsent();
    if (isInAppBrowser()) { openExternalBrowser(window.location.href); return; }
    const redirectUri = `${PUBLIC_BASE_URL}/api/auth/candidate/facebook/callback`;
    const u = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(fbAppId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile&response_type=code&state=${encodeURIComponent(dest)}`;
    window.location.href = u;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl border border-bl-line bg-white shadow-sm lg:grid lg:grid-cols-2">
        {/* Auth */}
        <div className="p-7 sm:p-9">
          <Logo size={52} className="mb-4" />
          <h1 className="text-2xl font-black">無料登録・ログイン</h1>
          <p className="mt-2 text-sm text-bl-gray">Google または Facebook で、かんたんに始められます。</p>
          {applyTitle && (
            <p className="mt-3 rounded-lg bg-bl-redsoft px-3 py-2 text-xs font-semibold text-bl-red">「{applyTitle}」への応募を続けるにはログインしてください。</p>
          )}

          <InAppBrowserNotice className="mt-4" />

          {/* Đồng ý Privacy Policy — bắt buộc trước khi đăng nhập */}
          <label className="mt-5 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-bl-gray">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 flex-none accent-bl-red" />
            <span><a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-bl-blue underline">プライバシーポリシー</a>に同意します</span>
          </label>

          <div className={`mt-3 space-y-3 ${agreed ? "" : "opacity-50"}`}>
            {/* Google — nút trắng viền nhẹ */}
            <a href={googleHref} onClick={onGoogleClick} aria-disabled={!agreed} className={`flex w-full items-center justify-center gap-2.5 rounded-full border border-bl-line bg-white py-3 text-[15px] font-bold text-ink shadow-sm transition hover:border-bl-gray2 hover:shadow ${agreed ? "" : "pointer-events-none"}`}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.3 13.3 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" /><path fill="#FBBC05" d="M10.5 28.4c-.5-1.5-.8-3-.8-4.4s.3-3 .8-4.4l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.6 10.6l7.9-6.2z" /><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.4-4.6 2.2-8.2 2.2-6.3 0-11.7-3.8-13.5-9.4l-7.9 6.2C6.5 42.6 14.6 48 24 48z" /></svg>
              Googleで続ける
            </a>
            {/* Facebook — nền xanh */}
            {fbAppId && (
              <button onClick={loginFb} disabled={!agreed} className="flex w-full items-center justify-center gap-2.5 rounded-full bg-bl-fb py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#0C63D4] disabled:cursor-not-allowed">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
                Facebookで続ける
              </button>
            )}
          </div>

          {error && <p className="mt-3 text-sm font-semibold text-bl-red">ログインに失敗しました。もう一度お試しください。</p>}

          <p className="mt-3 text-center text-[11px] leading-relaxed text-bl-gray2">
            ログインすることで、<a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-bl-blue underline">利用規約・プライバシーポリシー</a>に同意したものとみなされます。
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-[#FFF6F2] to-[#FFE2D8] p-7 sm:p-9">
          <h2 className="text-base font-black text-ink">無料登録するとできること</h2>
          <ul className="mt-4 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-bl-red text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span className="text-sm font-semibold text-ink">{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl bg-white/70 p-4 text-xs leading-relaxed text-bl-gray">
            登録は無料です。特定技能のお仕事探しを、BIGLIGHTの担当者がサポートします。
          </div>
        </div>
      </div>
    </div>
  );
}
