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

const LEVEL_PILL: Record<AdminRole, string> = {
  ADMIN: "bg-red-50 text-red-700 ring-1 ring-red-200",
  STAFF: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  VIEW: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};
const LEVEL_RING: Record<AdminRole, string> = {
  ADMIN: "ring-red-200 bg-red-50 text-red-600",
  STAFF: "ring-emerald-200 bg-emerald-50 text-emerald-600",
  VIEW: "ring-blue-200 bg-blue-50 text-blue-600",
};
const LEVEL_DOT: Record<AdminRole, string> = { ADMIN: "bg-red-500", STAFF: "bg-emerald-500", VIEW: "bg-blue-500" };

// Bảng "danh sách cấp quyền" — mô tả mỗi cấp được/không được làm gì.
const LEGEND: { level: AdminRole; sub: string; can: string[]; cannot: string[] }[] = [
  {
    level: "ADMIN",
    sub: "全権限",
    can: ["求人・応募者・記事・企業の全操作", "応募ステータス変更・CV管理", "メッセージ返信・削除", "ユーザー管理・権限変更・ロック", "設定・エクスポート"],
    cannot: [],
  },
  {
    level: "STAFF",
    sub: "日常運用",
    can: ["求人の追加・編集・削除・公開", "応募者の追加・編集・削除・状態変更", "記事の作成・編集・削除", "メッセージ返信", "エクスポート"],
    cannot: ["企業管理", "ユーザー管理", "設定", "メッセージ削除"],
  },
  {
    level: "VIEW",
    sub: "閲覧のみ",
    can: ["ダッシュボード・各一覧の閲覧", "企業情報の閲覧", "CVダウンロード", "エクスポート"],
    cannot: ["追加・編集・削除", "ステータス変更", "メッセージ返信", "ユーザー管理・設定"],
  },
];

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return s.slice(0, 10).replace(/-/g, "/");
}

// --- icon nhỏ (SVG line, không emoji) ---
const IconSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
const IconKey = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="3.5" /><path d="m10 13 8-8M16 3l3 3-2 2-3-3" /></svg>);
const IconLock = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
const IconUnlock = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></svg>);
const IconTrash = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>);
const IconCheck = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-500"><path d="M20 6 9 17l-5-5" /></svg>);
const IconX = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-300"><path d="M18 6 6 18M6 6l12 12" /></svg>);

export function UsersManager({ initial, meId }: { initial: UserRow[]; meId: string }) {
  const [users, setUsers] = useState<UserRow[]>(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [showLegend, setShowLegend] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cLevel, setCLevel] = useState<AdminRole>("VIEW");

  const [fRole, setFRole] = useState<"" | AdminRole>("");
  const [fStatus, setFStatus] = useState<"" | "ACTIVE" | "SUSPENDED">("");
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return users.filter((u) => {
      if (k && !(u.name.toLowerCase().includes(k) || u.email.toLowerCase().includes(k))) return false;
      if (fRole && levelOf(u) !== fRole) return false;
      if (fStatus && u.status !== fStatus) return false;
      return true;
    });
  }, [users, q, fRole, fStatus]);

  function exportCsv() {
    const head = ["氏名", "メール", "ロール", "状態", "最終ログイン"];
    const body = filtered.map((u) => [u.name, u.email, ADMIN_LEVEL_LABEL[levelOf(u)] ?? "", u.status === "ACTIVE" ? "有効" : "ロック", u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("ja-JP") : ""]);
    const csv = [head, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  const stats = useMemo(() => {
    const s = { total: users.length, ADMIN: 0, STAFF: 0, VIEW: 0, locked: 0 };
    for (const u of users) { s[levelOf(u)]++; if (u.status === "SUSPENDED") s.locked++; }
    return s;
  }, [users]);

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

  async function rename(u: UserRow, name: string) {
    if (!name.trim() || name.trim() === u.name) return;
    try {
      const { user } = await api(`/api/admin/users/${u.id}`, "PATCH", { name });
      setUsers((p) => p.map((x) => (x.id === u.id ? user : x)));
      setNotice(`氏名を「${user.name}」に変更しました。`);
    } catch (e) { setErr((e as Error).message); }
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

      {/* Stat chips */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <StatChip label="合計" value={stats.total} dot="bg-slate-400" />
        <StatChip label="Admin" value={stats.ADMIN} dot={LEVEL_DOT.ADMIN} />
        <StatChip label="Staff" value={stats.STAFF} dot={LEVEL_DOT.STAFF} />
        <StatChip label="View" value={stats.VIEW} dot={LEVEL_DOT.VIEW} />
        <StatChip label="ロック" value={stats.locked} dot="bg-amber-400" />
      </div>

      {/* 権限一覧 (danh sách cấp quyền) */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white">
        <button onClick={() => setShowLegend((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
            権限一覧（Admin / Staff / View）
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 transition ${showLegend ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {showLegend && (
          <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-3">
            {LEGEND.map((lg) => (
              <div key={lg.level} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={`badge ${LEVEL_PILL[lg.level]}`}>{ADMIN_LEVEL_LABEL[lg.level]}</span>
                  <span className="text-xs text-slate-400">{lg.sub}</span>
                </div>
                <ul className="space-y-1.5">
                  {lg.can.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600"><IconCheck />{t}</li>
                  ))}
                  {lg.cannot.map((t, i) => (
                    <li key={`n${i}`} className="flex items-start gap-1.5 text-xs text-slate-400 line-through decoration-slate-300"><IconX />{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-3">
          <div className="relative max-w-xs flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="氏名・メールで検索" className="input w-full pl-9" />
          </div>
          <select value={fRole} onChange={(e) => setFRole(e.target.value as "" | AdminRole)} className="input w-auto text-sm">
            <option value="">権限：すべて</option>
            {LEVELS.map((l) => <option key={l} value={l}>{ADMIN_LEVEL_LABEL[l]}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value as "" | "ACTIVE" | "SUSPENDED")} className="input w-auto text-sm">
            <option value="">状態：すべて</option>
            <option value="ACTIVE">有効</option>
            <option value="SUSPENDED">ロック</option>
          </select>
          <button onClick={exportCsv} className="btn btn-ghost btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>CSV</button>
          <div className="ml-auto text-xs text-slate-400">{filtered.length} 件</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/70 text-left text-[11px] uppercase tracking-wide text-slate-400">
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
                  <tr key={u.id} className="border-t border-slate-50 transition hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ring-2 ${LEVEL_RING[lvl]}`}>
                          {u.image ? <img src={u.image} alt="" className="h-full w-full object-cover" /> : u.name.slice(0, 1)}
                        </span>
                        <div className="flex min-w-0 items-center">
                          <input defaultValue={u.name} onBlur={(e) => rename(u, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} title="クリックして氏名を編集" className="w-[150px] rounded-md border border-transparent bg-transparent px-1.5 py-0.5 font-semibold text-ink outline-none hover:border-slate-200 focus:border-bl-red focus:bg-white" />
                          {isSelf && <span className="ml-1 shrink-0 text-[10px] font-medium text-slate-400">(自分)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className={`badge ${LEVEL_PILL[lvl]}`}>{ADMIN_LEVEL_LABEL[lvl]}</span>
                      ) : (
                        <div className={`inline-flex items-center rounded-full pr-1 ${LEVEL_PILL[lvl]}`}>
                          <select
                            value={lvl}
                            disabled={rowBusy}
                            onChange={(e) => changeLevel(u, e.target.value as AdminRole)}
                            className="cursor-pointer appearance-none bg-transparent py-0.5 pl-2.5 pr-1 text-xs font-bold outline-none"
                          >
                            {LEVELS.map((l) => <option key={l} value={l}>{ADMIN_LEVEL_LABEL[l]}</option>)}
                          </select>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${locked ? "text-red-600" : "text-emerald-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${locked ? "bg-red-500" : "bg-emerald-500"}`} />
                        {locked ? "ロック中" : "有効"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn onClick={() => resetPw(u)} disabled={rowBusy} title="パスワードリセット"><IconKey /></IconBtn>
                        <IconBtn
                          onClick={() => toggleLock(u)}
                          disabled={rowBusy || isSelf || (lastAdmin && !locked)}
                          title={isSelf ? "自分はロックできません" : lastAdmin && !locked ? "最後のAdminはロックできません" : locked ? "ロック解除" : "ロック"}
                        >{locked ? <IconUnlock /> : <IconLock />}</IconBtn>
                        <IconBtn
                          onClick={() => removeUser(u)}
                          disabled={rowBusy || isSelf || lastAdmin}
                          title={isSelf ? "自分は削除できません" : lastAdmin ? "最後のAdminは削除できません" : "削除"}
                          danger
                        ><IconTrash /></IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">該当するユーザーがありません。</td></tr>
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

function StatChip({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <div>
        <div className="text-lg font-black leading-none text-ink">{value}</div>
        <div className="text-[11px] text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, title, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-30 ${
        danger
          ? "border-red-200 text-red-500 hover:bg-red-50"
          : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
