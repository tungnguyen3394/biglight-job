"use client";

import { useMemo, useState } from "react";
import type { AdminRole, Role, AccountStatus } from "@prisma/client";
import { ADMIN_LEVEL_LABEL } from "@/lib/adminAccess";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  adminRole: AdminRole | null;
  status: AccountStatus;
  lastLoginAt: string | null;
  image: string | null;
}

const LEVELS: AdminRole[] = ["ADMIN", "STAFF", "VIEW"];

// Suy ra cấp hiển thị (giống server): adminRole ưu tiên, fallback theo role gốc.
function levelOf(u: UserRow): AdminRole {
  if (u.adminRole) return u.adminRole;
  if (u.role === "SUPER_ADMIN" || u.role === "MANAGER") return "ADMIN";
  return "STAFF";
}

const LEVEL_BADGE: Record<AdminRole, string> = {
  ADMIN: "bg-red-50 text-red-700 ring-1 ring-red-100",
  STAFF: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  VIEW: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
};

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return s.slice(0, 10).replace(/-/g, "/");
}

export function UsersManager({ initial, meId }: { initial: UserRow[]; meId: string }) {
  const [users, setUsers] = useState<UserRow[]>(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  // Modal tạo user
  const [showCreate, setShowCreate] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cLevel, setCLevel] = useState<AdminRole>("VIEW");

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return users;
    return users.filter((u) => u.name.toLowerCase().includes(k) || u.email.toLowerCase().includes(k));
  }, [users, q]);

  const adminCount = useMemo(() => users.filter((u) => u.status === "ACTIVE" && levelOf(u) === "ADMIN").length, [users]);

  async function api(url: string, method: string, body?: unknown) {
    setErr("");
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "エラーが発生しました。");
    return json;
  }

  async function createUser() {
    if (!cName.trim() || !cEmail.trim()) { setErr("氏名とメールを入力してください。"); return; }
    setBusy("create");
    try {
      const { user } = await api("/api/admin/users", "POST", { name: cName, email: cEmail, adminRole: cLevel });
      setUsers((p) => [...p, user]);
      setShowCreate(false); setCName(""); setCEmail(""); setCLevel("VIEW");
      setNotice(`${user.name} を追加しました。`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }

  async function changeLevel(u: UserRow, level: AdminRole) {
    setBusy(u.id);
    try {
      const { user } = await api(`/api/admin/users/${u.id}`, "PATCH", { adminRole: level });
      setUsers((p) => p.map((x) => (x.id === u.id ? user : x)));
      setNotice(`${user.name} のロールを ${ADMIN_LEVEL_LABEL[level]} に変更しました。`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }

  async function toggleLock(u: UserRow) {
    const next = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setBusy(u.id);
    try {
      const { user } = await api(`/api/admin/users/${u.id}`, "PATCH", { status: next });
      setUsers((p) => p.map((x) => (x.id === u.id ? user : x)));
      setNotice(`${user.name} を${next === "SUSPENDED" ? "ロック" : "ロック解除"}しました。`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }

  async function resetPw(u: UserRow) {
    setBusy(u.id);
    try {
      const { tempPassword } = await api(`/api/admin/users/${u.id}/reset-password`, "POST");
      setNotice(`${u.name} の仮パスワード： ${tempPassword}（安全に共有してください）`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }

  async function removeUser(u: UserRow) {
    if (!window.confirm(`${u.name}（${u.email}）を削除しますか？この操作は元に戻せません。`)) return;
    setBusy(u.id);
    try {
      await api(`/api/admin/users/${u.id}`, "DELETE");
      setUsers((p) => p.filter((x) => x.id !== u.id));
      setNotice(`${u.name} を削除しました。`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-black text-ink">ユーザー管理</h1>
          <p className="text-sm text-slate-500">社内アカウント（Admin / Staff / View）の作成・ロール変更・ロック・削除</p>
        </div>
        <button onClick={() => { setShowCreate(true); setErr(""); }} className="btn btn-navy gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          ユーザー追加
        </button>
      </div>

      {notice && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-100">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}
      {err && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
          <span>{err}</span>
          <button onClick={() => setErr("")} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-slate-100 p-3">
          <div className="relative max-w-xs flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="氏名・メールで検索" className="input w-full pl-9" />
          </div>
          <div className="ml-auto text-xs text-slate-400">{filtered.length} 件</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-semibold">氏名</th>
                <th className="px-4 py-2.5 font-semibold">メール</th>
                <th className="px-4 py-2.5 font-semibold">ロール</th>
                <th className="px-4 py-2.5 font-semibold">状態</th>
                <th className="px-4 py-2.5 font-semibold">最終ログイン</th>
                <th className="px-4 py-2.5 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const lvl = levelOf(u);
                const isSelf = u.id === meId;
                const locked = u.status === "SUSPENDED";
                const rowBusy = busy === u.id;
                const lastAdmin = lvl === "ADMIN" && adminCount <= 1;
                return (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                          {u.image ? <img src={u.image} alt="" className="h-full w-full object-cover" /> : u.name.slice(0, 1)}
                        </span>
                        <span className="font-semibold text-ink">{u.name}{isSelf && <span className="ml-1.5 text-[10px] font-medium text-slate-400">(自分)</span>}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className={`badge ${LEVEL_BADGE[lvl]}`}>{ADMIN_LEVEL_LABEL[lvl]}</span>
                      ) : (
                        <select
                          value={lvl}
                          disabled={rowBusy}
                          onChange={(e) => changeLevel(u, e.target.value as AdminRole)}
                          className={`badge cursor-pointer border-0 outline-none ${LEVEL_BADGE[lvl]}`}
                        >
                          {LEVELS.map((l) => <option key={l} value={l}>{ADMIN_LEVEL_LABEL[l]}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {locked
                        ? <span className="badge bg-red-50 text-red-700 ring-1 ring-red-100">ロック中</span>
                        : <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">有効</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => resetPw(u)} disabled={rowBusy} title="パスワードリセット" className="btn btn-ghost btn-sm text-xs">リセット</button>
                        <button
                          onClick={() => toggleLock(u)}
                          disabled={rowBusy || isSelf || (lastAdmin && !locked)}
                          title={isSelf ? "自分はロックできません" : lastAdmin && !locked ? "最後のAdminはロックできません" : ""}
                          className="btn btn-ghost btn-sm text-xs disabled:opacity-40"
                        >
                          {locked ? "解除" : "ロック"}
                        </button>
                        <button
                          onClick={() => removeUser(u)}
                          disabled={rowBusy || isSelf || lastAdmin}
                          title={isSelf ? "自分は削除できません" : lastAdmin ? "最後のAdminは削除できません" : ""}
                          className="btn btn-sm border border-red-200 bg-white text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">該当するユーザーがありません。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: tạo user */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-ink">ユーザー追加</h2>
            <p className="mt-1 text-xs text-slate-500">社内メール（@biglight.jp）。Googleでログインします。</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">氏名</label>
                <input value={cName} onChange={(e) => setCName(e.target.value)} className="input w-full" placeholder="山田 太郎" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">メール</label>
                <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="input w-full" placeholder="taro@biglight.jp" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">ロール</label>
                <select value={cLevel} onChange={(e) => setCLevel(e.target.value as AdminRole)} className="input w-full">
                  {LEVELS.map((l) => <option key={l} value={l}>{ADMIN_LEVEL_LABEL[l]}</option>)}
                </select>
              </div>
              {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</div>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn btn-ghost btn-sm">キャンセル</button>
              <button onClick={createUser} disabled={busy === "create"} className="btn btn-navy btn-sm">{busy === "create" ? "作成中…" : "作成"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
