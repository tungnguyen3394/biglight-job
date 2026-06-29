"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, publicStatusTone } from "@/components/ui/Badge";
import { PUBLIC_STATUS_LABEL, JOB_OP_STATUS_LABEL } from "@/lib/constants";
import { SearchIcon, FilterIcon, SortIcon, ColumnsIcon, MailIcon, ExportBar } from "@/components/admin/toolbar";

export type CompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contractDate: string | null;
  paymentInfo: string | null;
  contractDetail: string | null;
  notes: string | null;
  applicants: number;
  total: number;
  open: number;
  createdAt: string;
  jobs: { id: string; code: string; title: string; opStatus: string; publicStatus: string }[];
};

const uniq = (arr: (string | null)[]) => [...new Set(arr.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, "ja"));

type ColKey = "name" | "industry" | "contactName" | "phone" | "email" | "address" | "contractDate" | "paymentInfo" | "contractDetail" | "notes" | "total" | "open" | "applicants" | "createdAt";
const COLUMNS: { key: ColKey; label: string; w: number; value: (r: CompanyRow) => string }[] = [
  { key: "name", label: "企業名", w: 200, value: (r) => r.name },
  { key: "industry", label: "業種", w: 150, value: (r) => r.industry || "" },
  { key: "contactName", label: "担当者", w: 120, value: (r) => r.contactName || "" },
  { key: "phone", label: "電話番号", w: 135, value: (r) => r.phone || "" },
  { key: "email", label: "メール", w: 210, value: (r) => r.email || "" },
  { key: "address", label: "住所", w: 200, value: (r) => r.address || "" },
  { key: "contractDate", label: "契約日", w: 110, value: (r) => r.contractDate || "" },
  { key: "paymentInfo", label: "支払い情報", w: 160, value: (r) => r.paymentInfo || "" },
  { key: "contractDetail", label: "契約内容", w: 200, value: (r) => r.contractDetail || "" },
  { key: "notes", label: "備考", w: 200, value: (r) => r.notes || "" },
  { key: "total", label: "求人数", w: 76, value: (r) => String(r.total) },
  { key: "open", label: "募集中", w: 76, value: (r) => String(r.open) },
  { key: "applicants", label: "応募者数", w: 84, value: (r) => String(r.applicants) },
  { key: "createdAt", label: "登録日", w: 110, value: (r) => r.createdAt },
];
const DEFAULT_COLS: ColKey[] = ["name", "industry", "contactName", "phone", "email", "contractDate", "total", "applicants"];

type SortField = "name" | "industry" | "contactName" | "total" | "open" | "applicants" | "contractDate" | "createdAt";
type SortItem = { key: SortField; dir: "asc" | "desc" };
const jcmp = (x?: string | null, y?: string | null) => (x || "").localeCompare(y || "", "ja");
const SORT_FIELDS: { key: SortField; label: string; cmp: (a: CompanyRow, b: CompanyRow) => number }[] = [
  { key: "name", label: "企業名", cmp: (a, b) => jcmp(a.name, b.name) },
  { key: "industry", label: "業種", cmp: (a, b) => jcmp(a.industry, b.industry) },
  { key: "contactName", label: "担当者", cmp: (a, b) => jcmp(a.contactName, b.contactName) },
  { key: "total", label: "求人数", cmp: (a, b) => a.total - b.total },
  { key: "open", label: "募集中", cmp: (a, b) => a.open - b.open },
  { key: "applicants", label: "応募者数", cmp: (a, b) => a.applicants - b.applicants },
  { key: "contractDate", label: "契約日", cmp: (a, b) => jcmp(a.contractDate, b.contractDate) },
  { key: "createdAt", label: "登録日", cmp: (a, b) => jcmp(a.createdAt, b.createdAt) },
];
const SORT_LABEL = (k: SortField) => SORT_FIELDS.find((f) => f.key === k)?.label ?? k;

export function CompaniesManager({ rows, canCreateJob }: { rows: CompanyRow[]; canCreateJob: boolean }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "card">("list");
  const [fInd, setFInd] = useState("");
  const [fContact, setFContact] = useState("");
  const [fJobs, setFJobs] = useState(""); // "" | "open" | "none"
  const [sortList, setSortList] = useState<SortItem[]>([{ key: "name", dir: "asc" }]);
  const [cols, setCols] = useState<Set<ColKey>>(() => new Set(DEFAULT_COLS));
  const visCols = COLUMNS.filter((c) => cols.has(c.key));
  const toggleCol = (k: ColKey) => setCols((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const selectAllCols = () => setCols(new Set(COLUMNS.map((c) => c.key)));
  const clearCols = () => setCols(new Set(["name"]));

  // ----- chọn để gửi mail -----
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mailOpen, setMailOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  async function doSend() {
    const ids = [...selected];
    if (!ids.length || !subject.trim() || !body.trim() || sending) return;
    setSending(true); setSendMsg("");
    const r = await fetch("/api/admin/companies/mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setSending(false); setConfirming(false); setSendMsg(j.error || "送信に失敗しました。"); return; }
    try {
      await fetch(j.gasUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ secret: j.secret, to: j.emails, subject, body, replyTo: j.replyTo, name: j.name }) });
      setSendMsg(`${j.emails.length}件に送信しました。`);
      setSelected(new Set()); setSubject(""); setBody(""); setConfirming(false);
      setTimeout(() => { setMailOpen(false); setSendMsg(""); }, 1800);
    } catch { setSendMsg("送信に失敗しました（GASに接続できません）。"); }
    finally { setSending(false); }
  }

  // ----- sắp xếp nâng cao -----
  const addSort = (k: SortField) => setSortList((p) => (p.some((s) => s.key === k) ? p : [...p, { key: k, dir: "asc" }]));
  const removeSort = (k: SortField) => setSortList((p) => p.filter((s) => s.key !== k));
  const toggleDir = (k: SortField) => setSortList((p) => p.map((s) => (s.key === k ? { ...s, dir: s.dir === "asc" ? "desc" : "asc" } : s)));
  const moveSort = (i: number, d: -1 | 1) => setSortList((p) => { const n = [...p]; const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const availableSort = SORT_FIELDS.filter((f) => !sortList.some((s) => s.key === f.key));

  const inds = useMemo(() => uniq(rows.map((r) => r.industry)), [rows]);
  const contacts = useMemo(() => uniq(rows.map((r) => r.contactName)), [rows]);

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
      if (fInd && r.industry !== fInd) return false;
      if (fContact && r.contactName !== fContact) return false;
      if (fJobs === "open" && r.open === 0) return false;
      if (fJobs === "none" && r.total > 0) return false;
      if (q) {
        const t = `${r.name}${r.industry ?? ""}${r.contactName ?? ""}${r.phone ?? ""}${r.email ?? ""}${r.address ?? ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    const cmps = sortList.map((s) => ({ cmp: SORT_FIELDS.find((f) => f.key === s.key)!.cmp, dir: s.dir }));
    out = [...out].sort((a, b) => {
      for (const { cmp, dir } of cmps) { let r = cmp(a, b); if (dir === "desc") r = -r; if (r !== 0) return r; }
      return 0;
    });
    return out;
  }, [rows, q, fInd, fContact, fJobs, sortList]);

  const emailRows = filtered.filter((r) => r.email);
  const allSelected = emailRows.length > 0 && emailRows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(emailRows.map((r) => r.id)));

  const activeFilters = [fInd, fContact, fJobs].filter(Boolean).length;
  const clearFilters = () => { setFInd(""); setFContact(""); setFJobs(""); };
  const totalOrders = rows.reduce((s, r) => s + r.total, 0);

  const getData = () => ({ headers: visCols.map((c) => c.label), rows: filtered.map((r) => visCols.map((c) => c.value(r))) });

  return (
    <div className="space-y-4">
      {/* ===== toolbar ===== */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <SearchIcon />
          <input className="input pl-9" placeholder="企業名・業種・担当者で検索" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {/* 絞り込み */}
        <details className="relative">
          <summary className="btn btn-ghost btn-sm cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden">
            <FilterIcon />
            絞り込み{activeFilters > 0 && <span className="rounded-full bg-bl-red px-1.5 text-[10px] font-bold text-white">{activeFilters}</span>}
          </summary>
          <div className="absolute left-0 z-30 mt-1 max-h-[70vh] w-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <div><div className="mb-1 text-xs font-bold text-slate-500">業種</div><select className="input w-full" value={fInd} onChange={(e) => setFInd(e.target.value)}><option value="">すべて</option>{inds.map((i) => <option key={i}>{i}</option>)}</select></div>
            <div><div className="mb-1 text-xs font-bold text-slate-500">担当者</div><select className="input w-full" value={fContact} onChange={(e) => setFContact(e.target.value)}><option value="">すべて</option>{contacts.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><div className="mb-1 text-xs font-bold text-slate-500">求人状況</div><select className="input w-full" value={fJobs} onChange={(e) => setFJobs(e.target.value)}><option value="">すべて</option><option value="open">募集中あり</option><option value="none">求人なし</option></select></div>
            {activeFilters > 0 && <button onClick={clearFilters} className="text-xs font-semibold text-bl-red hover:underline">フィルターをクリア</button>}
          </div>
        </details>

        {/* 並び替え */}
        <details className="relative">
          <summary className="btn btn-ghost btn-sm cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden">
            <SortIcon />
            並び替え{sortList.length > 0 && <span className="rounded-full bg-slate-700 px-1.5 text-[10px] font-bold text-white">{sortList.length}</span>}
          </summary>
          <div className="absolute right-0 z-30 mt-1 w-72 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            {sortList.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5">
                <span className="text-[10px] font-bold text-slate-400">{i + 1}</span>
                <span className="flex-1 text-sm font-semibold text-ink">{SORT_LABEL(s.key)}</span>
                <button onClick={() => toggleDir(s.key)} className="rounded px-1.5 py-0.5 text-[11px] font-bold text-bl-red hover:bg-white">{s.dir === "asc" ? "昇順" : "降順"}</button>
                <button onClick={() => moveSort(i, -1)} disabled={i === 0} className="px-1 text-slate-400 disabled:opacity-30">↑</button>
                <button onClick={() => moveSort(i, 1)} disabled={i === sortList.length - 1} className="px-1 text-slate-400 disabled:opacity-30">↓</button>
                <button onClick={() => removeSort(s.key)} className="px-1 text-slate-400 hover:text-bl-red">✕</button>
              </div>
            ))}
            {availableSort.length > 0 && (
              <select className="input w-full" value="" onChange={(e) => { if (e.target.value) addSort(e.target.value as SortField); }}>
                <option value="">＋ 並び替え項目を追加</option>
                {availableSort.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            )}
            <button onClick={() => setSortList([{ key: "name", dir: "asc" }])} className="text-xs font-semibold text-bl-red hover:underline">リセット</button>
          </div>
        </details>

        {/* 表示項目 (chỉ áp dụng リスト) */}
        {view === "list" && (
          <details className="relative">
            <summary className="btn btn-ghost btn-sm cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden">
              <ColumnsIcon />
              表示項目
            </summary>
            <div className="absolute right-0 z-30 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-1.5 flex gap-3 border-b border-slate-100 pb-1.5">
                <button onClick={selectAllCols} className="text-xs font-semibold text-bl-red hover:underline">すべて選択</button>
                <button onClick={clearCols} className="text-xs font-semibold text-slate-500 hover:underline">クリア</button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {COLUMNS.map((c) => (
                  <label key={c.key} className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <input type="checkbox" checked={cols.has(c.key)} disabled={c.key === "name"} onChange={() => toggleCol(c.key)} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
          </details>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* カード / リスト */}
          <div className="flex overflow-hidden rounded-lg border border-slate-200">
            <button onClick={() => setView("list")} className={`px-2.5 py-1.5 text-xs font-bold ${view === "list" ? "bg-ink text-white" : "bg-white text-slate-500"}`}>リスト</button>
            <button onClick={() => setView("card")} className={`px-2.5 py-1.5 text-xs font-bold ${view === "card" ? "bg-ink text-white" : "bg-white text-slate-500"}`}>カード</button>
          </div>
          <ExportBar compact filename="企業一覧" title="企業一覧" getData={getData} />
          <button onClick={() => { if (selected.size) { setMailOpen(true); setSendMsg(""); setConfirming(false); } }} disabled={selected.size === 0} className="btn btn-navy btn-sm gap-1.5 disabled:opacity-40">
            <MailIcon />
            メール送信{selected.size > 0 && `（${selected.size}）`}
          </button>
          <span className="text-sm text-slate-500">{filtered.length} 社 ・ 求人 {totalOrders} 件</span>
        </div>
      </div>

      {filtered.length === 0 && <div className="card p-10 text-center text-slate-400">該当する企業がありません</div>}

      {/* ===== LIST (bảng đầy đủ) ===== */}
      {view === "list" && filtered.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold text-slate-500">
                <th className="w-12 px-3 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} title="メール対象を全選択" /></th>
                {visCols.map((c) => <th key={c.key} className="px-3 py-2.5 font-bold" style={{ minWidth: c.w }}>{c.label}</th>)}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">{r.email ? <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSel(r.id)} /> : <span className="text-[10px] text-slate-300" title="メール未登録">—</span>}</td>
                  {visCols.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 align-top">
                      {c.key === "name"
                        ? <Link href={`/admin/companies/${r.id}`} className="font-semibold text-ink hover:text-bl-red hover:underline">{r.name}</Link>
                        : <span className="block max-w-[260px] truncate text-slate-600" title={c.value(r)}>{c.value(r) || <span className="text-slate-300">—</span>}</span>}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <Link href={`/admin/companies/${r.id}`} className="text-xs font-semibold text-bl-red hover:underline">詳細 ›</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== CARD (giữ bản cũ, kèm 求人) ===== */}
      {view === "card" && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-3">
                {c.email && <input type="checkbox" className="mt-1.5" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} title="メール対象" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/companies/${c.id}`} className="text-base font-black text-ink hover:text-bl-red hover:underline">{c.name}</Link>
                    {c.industry && <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-blue">{c.industry}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    {c.contactName && <span>担当：{c.contactName}</span>}
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && <span className="truncate">{c.email}</span>}
                    {c.contractDate && <span>契約日：{c.contractDate}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center"><div className="text-2xl font-black text-ink">{c.total}</div><div className="text-[10px] font-bold text-slate-400">求人数</div></div>
                  <div className="text-center"><div className="text-2xl font-black text-bl-green">{c.open}</div><div className="text-[10px] font-bold text-slate-400">募集中</div></div>
                  <Link href={`/admin/companies/${c.id}`} className="text-center"><div className="text-2xl font-black text-bl-red hover:underline">{c.applicants}</div><div className="text-[10px] font-bold text-slate-400">応募者数</div></Link>
                  <Link href={`/admin/companies/${c.id}`} className="btn btn-ghost gap-1.5 px-3 py-2 text-xs">詳細<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></Link>
                  {canCreateJob && <Link href={`/admin/jobs/new?company=${c.id}`} className="btn btn-ghost gap-1.5 px-3 py-2 text-xs"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>求人追加</Link>}
                </div>
              </div>
              {c.jobs.length > 0 ? (
                <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  {c.jobs.map((j) => (
                    <Link key={j.id} href={`/admin/jobs/${j.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50">
                      <span className="font-mono text-[11px] font-bold text-slate-400">{j.code}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{j.title}</span>
                      <span className="text-[10px] text-slate-400">{JOB_OP_STATUS_LABEL[j.opStatus] ?? j.opStatus}</span>
                      <Badge tone={publicStatusTone(j.publicStatus) as never}>{PUBLIC_STATUS_LABEL[j.publicStatus] ?? j.publicStatus}</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">この企業の求人はまだありません。</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== modal gửi mail ===== */}
      {mailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setMailOpen(false); setConfirming(false); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-ink">メール送信（{selected.size}社）</h3>
              <button onClick={() => { setMailOpen(false); setConfirming(false); }} className="text-slate-400 hover:text-ink">✕</button>
            </div>
            <p className="mb-3 text-xs text-slate-500">選択した企業のメールアドレス宛に送信します。返信先はあなた（ログイン中のスタッフ）になります。</p>
            <label className="mb-1 block text-xs font-bold text-slate-500">件名</label>
            <input value={subject} onChange={(e) => { setSubject(e.target.value); setConfirming(false); }} className="input mb-3 w-full" placeholder="件名を入力" />
            <label className="mb-1 block text-xs font-bold text-slate-500">本文</label>
            <textarea value={body} onChange={(e) => { setBody(e.target.value); setConfirming(false); }} rows={8} className="input w-full" placeholder="本文を入力…" />
            {sendMsg && <p className={`mt-2 text-sm font-semibold ${sendMsg.includes("送信しました") ? "text-emerald-600" : "text-red-600"}`}>{sendMsg}</p>}
            {confirming && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                選択した{selected.size}社のメールアドレスへ送信します。送信後は取り消せません。よろしいですか？
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setMailOpen(false); setConfirming(false); }} className="btn btn-ghost">キャンセル</button>
              {confirming ? (
                <>
                  <button onClick={() => setConfirming(false)} disabled={sending} className="btn btn-ghost">戻る</button>
                  <button onClick={doSend} disabled={sending} className="btn btn-navy disabled:opacity-50">{sending ? "送信中…" : "はい、送信する"}</button>
                </>
              ) : (
                <button onClick={() => setConfirming(true)} disabled={!subject.trim() || !body.trim()} className="btn btn-navy disabled:opacity-50">送信する</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
