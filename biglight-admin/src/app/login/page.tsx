"use client";

import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import InAppBrowserNotice from "@/components/common/InAppBrowserNotice";

declare global {
  interface Window {
    google?: any;
    handleGoogleCredential?: (resp: { credential: string }) => void;
  }
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [error, setError] = useState("");

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Google Identity Services — đăng nhập admin chỉ bằng Google Workspace (@biglight.jp).
  useEffect(() => {
    window.handleGoogleCredential = async (resp) => {
      setError("");
      const r = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: resp.credential }),
      });
      if (r.ok) {
        router.push(next);
        router.refresh();
      } else {
        const d = await r.json().catch(() => ({}));
        setError(d.error || "Googleログインに失敗しました");
      }
    };
  }, [router, next]);

  function initGoogle() {
    if (!clientId || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: window.handleGoogleCredential,
    });
    window.google.accounts.id.renderButton(document.getElementById("gbtn"), {
      theme: "outline",
      size: "large",
      width: 300,
      text: "signin_with",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 to-navy p-6">
      <Script src="https://accounts.google.com/gsi/client" onLoad={initGoogle} />
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-lg font-black text-white">
            B
          </div>
          <h1 className="text-xl font-black text-navy">BIGLIGHT Admin</h1>
          <p className="mt-1 text-sm text-slate-500">管理システムにログイン</p>
        </div>

        <InAppBrowserNotice className="mb-4" />

        {/* Google sign-in (chỉ @biglight.jp) */}
        <div className="flex justify-center">
          {clientId ? (
            <div id="gbtn" />
          ) : (
            <p className="text-xs text-slate-400">
              （Googleログインは NEXT_PUBLIC_GOOGLE_CLIENT_ID 設定後に表示されます）
            </p>
          )}
        </div>

        {error && <p className="mt-4 text-center text-sm font-semibold text-red-600">{error}</p>}

        <p className="mt-6 text-center text-xs text-slate-400">
          BIGLIGHT社内アカウント（@biglight.jp）のみログインできます。
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
