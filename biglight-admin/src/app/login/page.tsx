"use client";

import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Google Identity Services
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "ログインに失敗しました");
    }
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

        {/* Google sign-in */}
        <div className="mb-5 flex justify-center">
          {clientId ? (
            <div id="gbtn" />
          ) : (
            <p className="text-xs text-slate-400">
              （Googleログインは NEXT_PUBLIC_GOOGLE_CLIENT_ID 設定後に表示されます）
            </p>
          )}
        </div>

        <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" /> または <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Email + password */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">メールアドレス</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@biglight.jp" required />
          </div>
          <div>
            <label className="label">パスワード</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button className="btn btn-navy w-full" disabled={loading}>
            {loading ? "..." : "ログイン"}
          </button>
        </form>
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
