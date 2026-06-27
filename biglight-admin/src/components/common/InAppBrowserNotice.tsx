"use client";

import { useEffect, useState } from "react";

// Phát hiện in-app browser (webview của Facebook/Zalo/Instagram/Line...). Google
// CHẶN đăng nhập OAuth trong webview → phải mở bằng Chrome/Safari mới login được.
export default function InAppBrowserNotice({ className }: { className?: string }) {
  const [show, setShow] = useState(false);
  const [os, setOs] = useState<"android" | "ios" | "other">("other");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const webview = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|NAVER|Zalo|MicroMessenger|KAKAOTALK|TikTok|musical_ly|Snapchat|Twitter/i.test(ua);
    // Một số webview Android lộ diện qua "; wv)"
    const androidWv = /Android.*; wv\)/i.test(ua);
    setShow(webview || androidWv);
    if (/android/i.test(ua)) setOs("android");
    else if (/iphone|ipad|ipod/i.test(ua)) setOs("ios");
  }, []);

  if (!show) return null;

  const url = typeof window !== "undefined" ? window.location.href : "";

  function openExternal() {
    if (os === "android") {
      const noScheme = url.replace(/^https?:\/\//, "");
      window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
    } else if (os === "ios") {
      // thử mở Chrome trên iOS; nếu không có Chrome, người dùng dùng hướng dẫn thủ công bên dưới
      window.location.href = url.replace(/^https:\/\//, "googlechromes://").replace(/^http:\/\//, "googlechrome://");
    }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }

  return (
    <div className={`rounded-xl border border-amber-300 bg-amber-50 p-3.5 ${className || ""}`} role="alert">
      <div className="flex items-start gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
        <div className="text-xs text-amber-900">
          <b>アプリ内ブラウザでは Google ログインができません。</b>
          <p className="mt-0.5">Chrome または Safari で開いてからログインしてください。</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button onClick={openExternal} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
          ブラウザで開く
        </button>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
          {copied ? "コピーしました" : "URLをコピー"}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-amber-700">
        {os === "ios"
          ? "うまくいかない場合：右上の「共有」または「…」→「Safari/ブラウザで開く」を選んでください。"
          : "うまくいかない場合：右上の「︙」メニュー →「ブラウザで開く」を選んでください。"}
      </p>
    </div>
  );
}
