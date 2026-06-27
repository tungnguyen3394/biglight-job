"use client";

import { useEffect, useState } from "react";
import { CONSENT_OPEN_EVENT, hasCookieConsent, setCookieConsent } from "@/lib/cookieConsent";

export default function CookiePolicyConsent() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!hasCookieConsent()) setVisible(true);
    // Nút login yêu cầu mở popup khi chưa đồng ý.
    const open = () => { if (!hasCookieConsent()) { setChecked(false); setVisible(true); } };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  if (!mounted || !visible) return null;

  function agree() {
    if (!checked) return;
    setCookieConsent();
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="プライバシーポリシーへの同意">
      {/* lớp mờ nhẹ phía sau để nổi bật popup, không chặn cuộn toàn trang */}
      <div className="pointer-events-none fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="pointer-events-auto relative w-full max-w-md rounded-3xl border border-bl-line bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bl-redsoft text-bl-red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5z" /><circle cx="9.5" cy="11.5" r="1" fill="currentColor" stroke="none" /><circle cx="14.5" cy="14.5" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="16" r="1" fill="currentColor" stroke="none" /></svg>
          </span>
          <div>
            <h2 className="text-base font-black text-ink">プライバシーポリシーへの同意</h2>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-bl-gray">
          BIGLIGHT JOBでは、ログイン状態の維持、利便性向上、サービス改善のためCookieを使用します。また、Googleログイン・Facebookログインを利用する場合、氏名・メールアドレス・プロフィール画像等を取得する場合があります。詳細はプライバシーポリシーをご確認ください。
        </p>

        <a href="/privacy-policy" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-bl-blue hover:underline">
          プライバシーポリシーを確認する
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
        </a>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-bl-bg p-3">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-bl-red" />
          <span className="text-[13px] font-semibold text-ink">プライバシーポリシーに同意します</span>
        </label>

        <button
          onClick={agree}
          disabled={!checked}
          className="mt-4 w-full rounded-xl bg-bl-red py-3 text-sm font-bold text-white shadow-sm transition hover:bg-bl-redd disabled:cursor-not-allowed disabled:bg-bl-line disabled:text-bl-gray2 disabled:shadow-none"
        >
          同意して続ける
        </button>
      </div>
    </div>
  );
}
