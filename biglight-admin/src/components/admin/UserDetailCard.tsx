"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/common/Avatar";

type U = { id: string; name: string; email: string; image: string | null; perm: "Admin" | "Staff" };

export default function UserDetailCard({ user }: { user: U }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState<string | null>(user.image);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    setBusy(true); setErr("");
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok && j.url) setImage(j.url); else setErr(j.error || "画像のアップロードに失敗しました。");
  }
  async function save() {
    setBusy(true); setErr("");
    const r = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() || user.name, image }) });
    setBusy(false);
    if (r.ok) { setEdit(false); router.refresh(); } else setErr((await r.json().catch(() => ({}))).error || "保存に失敗しました。");
  }
  function cancel() { setName(user.name); setImage(user.image); setErr(""); setEdit(false); }

  const dash = <span className="text-slate-300">未設定</span>;
  const rows: [string, ReactNode][] = [
    ["氏名", edit ? null : (name || dash)],
    ["生年月日 / 年齢", dash],
    ["役職", dash],
    ["メール", user.email || dash],
    ["電話番号", dash],
    ["Facebook URL", dash],
    ["Instagram URL", dash],
    ["メモ", dash],
    ["権限", <span key="p" className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${user.perm === "Admin" ? "bg-bl-redsoft text-bl-red" : "bg-slate-100 text-slate-600"}`}>{user.perm}</span>],
  ];

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Avatar name={name} src={image ?? undefined} size={72} />
          {edit && (
            <button onClick={() => fileRef.current?.click()} disabled={busy} title="写真を変更" className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-bl-red text-white shadow disabled:opacity-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            </button>
          )}
        </div>
        <div className="min-w-0">
          {edit ? (
            <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full max-w-xs text-lg font-black" placeholder="氏名" />
          ) : (
            <h1 className="text-xl font-black text-ink">{name || "（無名）"}</h1>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${user.perm === "Admin" ? "bg-bl-redsoft text-bl-red" : "bg-slate-100 text-slate-600"}`}>{user.perm}</span>
            <span className="truncate text-xs text-slate-400">{user.email}</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          {edit ? (
            <>
              <button onClick={cancel} disabled={busy} className="btn btn-ghost btn-sm">キャンセル</button>
              <button onClick={save} disabled={busy} className="btn btn-navy btn-sm disabled:opacity-50">{busy ? "保存中…" : "保存"}</button>
            </>
          ) : (
            <button onClick={() => setEdit(true)} className="btn btn-navy btn-sm">編集</button>
          )}
        </div>
      </div>

      {err && <p className="mt-3 text-xs font-semibold text-red-600">{err}</p>}

      <dl className="mt-6 divide-y divide-slate-100">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[130px_1fr] gap-3 py-3 text-sm">
            <dt className="font-semibold text-slate-500">{k}</dt>
            <dd className="min-w-0 text-ink">{k === "氏名" && edit ? <span className="text-slate-400">上の欄で編集</span> : v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">※ 氏名・写真・権限を編集できます。生年月日・役職・電話番号・SNS・メモ は今後追加予定の項目です（現在は保存されません）。</p>
    </div>
  );
}
