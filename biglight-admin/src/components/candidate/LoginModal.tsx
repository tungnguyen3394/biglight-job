"use client";

import { useState } from "react";
import { PUBLIC_BASE_URL } from "@/lib/site";
import { isInAppBrowser, openExternalBrowser } from "@/lib/webview";
import { setCookieConsent } from "@/lib/cookieConsent";
import InAppBrowserNotice from "@/components/common/InAppBrowserNotice";

// Modal đăng nhập/đăng ký nhanh (Google / Facebook) — dùng cho nút「30秒で無料登録」.
export default function LoginModal({ open, onClose, redirect = "/mypage", title, desc }: { open: boolean; onClose: () => void; redirect?: string; title?: string; desc?: string }) {
  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const dest = redirect.startsWith("/") ? redirect : "/mypage";
  const googleHref = `/api/auth/candidate/google/start?redirect=${encodeURIComponent(dest)}`;
  const [agreed, setAgreed] = useState(false);

  function onGoogleClick(e: React.MouseEvent) {
    if (!agreed) { e.preventDefault(); return; }
    setCookieConsent();
    if (isInAppBrowser()) { e.preventDefault(); openExternalBrowser(window.location.href); }
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-5" onClick={onClose} role="dialog" aria-modal="true" aria-label="無料登録・ログイン">
      <div className="w-full max-w-sm rounded-3xl border border-bl-line bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">{title ?? "30秒で無料登録"}</h2>
            <p className="mt-1 text-xs text-bl-gray">{desc ?? "この求人に応募するには、無料のアカウント登録が必要です。"}</p>
          </div>
          <button onClick={onClose} aria-label="閉じる" className="flex h-8 w-8 items-center justify-center rounded-full text-bl-gray2 hover:bg-bl-bg hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Lợi ích */}
        <ul className="mt-4 space-y-2">
          {["履歴書（CV）は不要", "応募の進捗をいつでも確認できる", "BIGLIGHT担当者と直接チャットできる"].map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-bl-greensoft text-bl-green"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
              {t}
            </li>
          ))}
        </ul>

        <InAppBrowserNotice className="mt-4" />

        <div className={`mt-4 space-y-3 ${agreed ? "" : "opacity-50"}`}>
          <a href={googleHref} onClick={onGoogleClick} aria-disabled={!agreed} className={`flex w-full items-center justify-center gap-2.5 rounded-full border border-bl-line bg-white py-3 text-[15px] font-bold text-ink shadow-sm transition hover:border-bl-gray2 hover:shadow ${agreed ? "" : "pointer-events-none"}`}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.3 13.3 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" /><path fill="#FBBC05" d="M10.5 28.4c-.5-1.5-.8-3-.8-4.4s.3-3 .8-4.4l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.6 10.6l7.9-6.2z" /><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.4-4.6 2.2-8.2 2.2-6.3 0-11.7-3.8-13.5-9.4l-7.9 6.2C6.5 42.6 14.6 48 24 48z" /></svg>
            Googleで続ける
          </a>
          {fbAppId && (
            <button onClick={loginFb} disabled={!agreed} className="flex w-full items-center justify-center gap-2.5 rounded-full bg-bl-fb py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#0C63D4] disabled:cursor-not-allowed">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
              Facebookで続ける
            </button>
          )}
        </div>

        {/* Đồng ý Privacy Policy — bắt buộc; đặt dưới nút (thay cho dòng note cũ) */}
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-bl-gray">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 flex-none accent-bl-red" />
          <span><a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-bl-blue underline">プライバシーポリシー</a>に同意します</span>
        </label>
      </div>
    </div>
  );
}
