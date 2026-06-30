"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PIPELINE_STATUSES, PIPE_LABEL, PIPE_TONE, bucket, type PipeStatus } from "@/lib/pipeline";
import { FilterIcon, SortIcon, ColumnsIcon, ExportBar, Dropdown } from "@/components/admin/toolbar";
import { StageTracker } from "@/components/common/StageTracker";
import { STAGE_OF, isEnded } from "@/lib/applicationFlow";
import { requestDelete } from "@/lib/adminDelete";

type Staff = { id: string; name: string; image: string | null };
type ListItem = {
  id: string; candidateId: string; name: string; kana: string | null; nationality: string | null; image: string | null;
  jobTitle: string; jobCode: string; company: string; status: string;
  staffId: string | null; staffName: string | null; staffImage: string | null; createdAt: string; updatedAt: string;
};
type Timeline = { id: string; oldStatus: string | null; newStatus: string; memo: string | null; by: string | null; at: string };
type Detail = {
  id: string; status: string; staffId: string | null;
  interviewDate: string | null; offerDate: string | null; visaApplicationDate: string | null; joinDate: string | null; nextActionDate: string | null;
  internalMemo: string | null; applicantNote: string | null;
  candidate: { id: string; name: string; kana: string | null; nationality: string | null; phone: string | null; email: string | null; image: string | null; japaneseLevel: string | null; visaType: string | null; facebookUrl: string | null; instagramUrl: string | null; tiktokUrl: string | null; hasDocs: boolean };
  job: { id: string; title: string; code: string; location: string; city: string | null; industry: string };
  company: string; staff: Staff | null; lastMessage: string | null; lastMessageAt: string | null; timeline: Timeline[];
};

function Avatar({ name, image, size = 9 }: { name: string; image: string | null; size?: number }) {
  const cls = ({ 6: "h-6 w-6", 8: "h-8 w-8", 9: "h-9 w-9", 12: "h-12 w-12" } as Record<number, string>)[size] ?? "h-9 w-9";
  if (image) return <img src={image} alt="" className={`${cls} shrink-0 rounded-full object-cover`} />;
  return <span className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy`}>{(name || "?").charAt(0)}</span>;
}
const uniq = (a: (string | null)[]) => Array.from(new Set(a.filter((x): x is string => !!x))).sort();
const fmtDay = (iso: string) => iso.slice(0, 10).replace(/-/g, "/");
const fmtDT = (iso: string) => `${iso.slice(0, 10).replace(/-/g, "/")} ${iso.slice(11, 16)}`;

// Cột bật/tắt qua 表示項目 (cột 氏名 luôn hiển thị).
type PCol = "kana" | "nationality" | "status" | "job" | "jobCode" | "company" | "staff" | "createdAt" | "updatedAt";
const PCOLUMNS: { key: PCol; label: string; w: number; value: (i: ListItem) => string }[] = [
  { key: "kana", label: "フリガナ", w: 130, value: (i) => i.kana || "" },
  { key: "nationality", label: "国籍", w: 100, value: (i) => i.nationality || "" },
  { key: "status", label: "ステータス", w: 120, value: (i) => PIPE_LABEL[bucket(i.status)] },
  { key: "job", label: "求人", w: 180, value: (i) => i.jobTitle },
  { key: "jobCode", label: "求人コード", w: 100, value: (i) => i.jobCode },
  { key: "company", label: "企業", w: 150, value: (i) => i.company },
  { key: "staff", label: "担当者", w: 160, value: (i) => i.staffName || "未割当" },
  { key: "createdAt", label: "応募日", w: 100, value: (i) => fmtDay(i.createdAt) },
  { key: "updatedAt", label: "最終更新", w: 100, value: (i) => fmtDay(i.updatedAt) },
];
const PDEFAULT: PCol[] = ["status", "job", "company", "staff", "createdAt"];
type PSortKey = "createdAt" | "updatedAt" | "name" | "status" | "company" | "staff" | "nationality";
const PSORT: { key: PSortKey; label: string; val: (i: ListItem) => string }[] = [
  { key: "createdAt", label: "応募日", val: (i) => i.createdAt },
  { key: "updatedAt", label: "最終更新", val: (i) => i.updatedAt },
  { key: "name", label: "氏名", val: (i) => i.kana || i.name },
  { key: "status", label: "ステータス", val: (i) => i.status },
  { key: "company", label: "企業", val: (i) => i.company },
  { key: "staff", label: "担当者", val: (i) => i.staffName || "" },
  { key: "nationality", label: "国籍", val: (i) => i.nationality || "" },
];

export default function PipelineSplit({ canEdit, canRowDelete = false, canBulkDelete = false }: { canEdit: boolean; canRowDelete?: boolean; canBulkDelete?: boolean }) {
  const [list, setList] = useState<ListItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState<"" | PipeStatus>("");
  const [fStaff, setFStaff] = useState("");
  const [fCompany, setFCompany] = useState("");
  const [fJob, setFJob] = useState("");
  const [fNat, setFNat] = useState("");
  const [fDate, setFDate] = useState("");
  const [memoDraft, setMemoDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [pSort, setPSort] = useState<{ key: PSortKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [pcols, setPcols] = useState<Set<PCol>>(() => new Set(PDEFAULT));
  const togglePcol = (k: PCol) => setPcols((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const selectAllPcols = () => setPcols(new Set(PCOLUMNS.map((c) => c.key)));
  const clearPcols = () => setPcols(new Set());
  const pvis = PCOLUMNS.filter((c) => pcols.has(c.key));
  const [bulkSel, setBulkSel] = useState<Set<string>>(new Set());
  const [delBusy, setDelBusy] = useState(false);
  const toggleBulk = (id: string) => setBulkSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  async function delApps(ids: string[], label: string) {
    if (!ids.length || delBusy) return;
    if (!window.confirm(`${label}を削除します。元に戻せません。よろしいですか？`)) return;
    setDelBusy(true);
    const r = await requestDelete("application", ids);
    setDelBusy(false);
    if (r.ok) { setBulkSel(new Set()); setSel(null); setDetail(null); loadList(); } else alert(r.error);
  }

  async function loadList() {
    const r = await fetch("/api/admin/pipeline");
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setList(j.items || []); setStaff(j.staff || []); }
    setLoading(false);
  }
  async function loadDetail(id: string) {
    const r = await fetch(`/api/admin/pipeline/${id}`);
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setDetail(j); setMemoDraft(j.internalMemo || ""); }
  }
  useEffect(() => { loadList(); }, []);

  function select(id: string) { setSel(id); setDetail(null); setMsg(""); loadDetail(id); }

  async function patch(body: Record<string, unknown>) {
    if (!sel || !canEdit) return;
    await fetch(`/api/admin/pipeline/${sel}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await loadDetail(sel);
    loadList();
  }
  async function sendMessage() {
    const t = msg.trim();
    if (!t || !sel || sending) return;
    setSending(true);
    const r = await fetch(`/api/admin/pipeline/${sel}/message`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
    setSending(false);
    if (r.ok) { setMsg(""); loadDetail(sel); } else { const j = await r.json().catch(() => ({})); alert(j.error || "送信に失敗しました"); }
  }

  const companies = useMemo(() => uniq(list.map((i) => i.company)), [list]);
  const jobs = useMemo(() => uniq(list.map((i) => i.jobTitle)), [list]);
  const nats = useMemo(() => uniq(list.map((i) => i.nationality)), [list]);

  const filtered = useMemo(() => {
    const out = list.filter((i) => {
      if (fStatus && bucket(i.status) !== fStatus) return false;
      if (fStaff && i.staffId !== fStaff) return false;
      if (fCompany && i.company !== fCompany) return false;
      if (fJob && i.jobTitle !== fJob) return false;
      if (fNat && i.nationality !== fNat) return false;
      if (fDate && i.createdAt.slice(0, 10) < fDate) return false;
      if (q && !`${i.name}${i.kana ?? ""}${i.jobTitle}${i.company}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    const sf = PSORT.find((s) => s.key === pSort.key)!;
    out.sort((a, b) => { const r = sf.val(a).localeCompare(sf.val(b), "ja"); return pSort.dir === "desc" ? -r : r; });
    return out;
  }, [list, fStatus, fStaff, fCompany, fJob, fNat, fDate, q, pSort]);

  // dashboard counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of list) { const b = bucket(i.status); c[b] = (c[b] || 0) + 1; }
    return c;
  }, [list]);
  const CARDS: { key: "" | PipeStatus; label: string; n: number }[] = [
    { key: "", label: "応募総数", n: list.length },
    { key: "NEW", label: "新規応募", n: counts.NEW || 0 },
    { key: "CONSULTING", label: "面談", n: counts.CONSULTING || 0 },
    { key: "INTERVIEW_SCHEDULED", label: "面接", n: counts.INTERVIEW_SCHEDULED || 0 },
    { key: "OFFER", label: "内定", n: counts.OFFER || 0 },
    { key: "VISA_APPLYING", label: "ビザ申請", n: counts.VISA_APPLYING || 0 },
    { key: "JOINED", label: "入社", n: counts.JOINED || 0 },
    { key: "REJECTED", label: "不採用・辞退", n: (counts.REJECTED || 0) + (counts.DECLINED || 0) },
  ];

  const activeFilters = [fStaff, fCompany, fJob, fNat, fDate].filter(Boolean).length;
  const inputCls = "w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-bl-red disabled:bg-slate-50 disabled:text-slate-400";

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[22px] font-black text-ink">応募進捗</h1>
        <p className="text-sm text-slate-500">応募 → 入社までの進捗を管理（左：一覧 / 右：詳細）</p>
      </div>

      {/* Dashboard nhỏ */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
        {CARDS.map((c) => (
          <button key={c.label} onClick={() => setFStatus((p) => (p === c.key ? "" : c.key))} className={`rounded-xl border bg-white p-3 text-left transition ${fStatus === c.key && c.key !== "" ? "border-bl-red ring-1 ring-bl-red" : "border-slate-200 hover:border-slate-300"}`}>
            <div className="text-2xl font-black leading-none text-ink">{c.n}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500">{c.label}</div>
          </button>
        ))}
      </div>

      {/* ===== Danh sách (full-width) ===== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* filter bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
            <div className="relative max-w-xs flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="氏名・求人・企業で検索" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-bl-red" />
            </div>
            <Dropdown icon={<FilterIcon />} label="絞り込み" badge={activeFilters} width="w-64">
              <div><div className="mb-1 text-xs font-bold text-slate-500">担当者</div><select className={inputCls} value={fStaff} onChange={(e) => setFStaff(e.target.value)}><option value="">すべて</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><div className="mb-1 text-xs font-bold text-slate-500">企業</div><select className={inputCls} value={fCompany} onChange={(e) => setFCompany(e.target.value)}><option value="">すべて</option>{companies.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><div className="mb-1 text-xs font-bold text-slate-500">求人</div><select className={inputCls} value={fJob} onChange={(e) => setFJob(e.target.value)}><option value="">すべて</option>{jobs.map((j) => <option key={j}>{j}</option>)}</select></div>
              <div><div className="mb-1 text-xs font-bold text-slate-500">国籍</div><select className={inputCls} value={fNat} onChange={(e) => setFNat(e.target.value)}><option value="">すべて</option>{nats.map((n) => <option key={n}>{n}</option>)}</select></div>
              <div><div className="mb-1 text-xs font-bold text-slate-500">応募日（以降）</div><input type="date" className={inputCls} value={fDate} onChange={(e) => setFDate(e.target.value)} /></div>
              {activeFilters > 0 && <button onClick={() => { setFStaff(""); setFCompany(""); setFJob(""); setFNat(""); setFDate(""); }} className="text-xs font-semibold text-bl-red hover:underline">クリア</button>}
            </Dropdown>
            <Dropdown icon={<SortIcon />} label="並び替え" width="w-56">
              <select className={inputCls} value={pSort.key} onChange={(e) => setPSort((p) => ({ ...p, key: e.target.value as PSortKey }))}>
                {PSORT.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button onClick={() => setPSort((p) => ({ ...p, dir: p.dir === "asc" ? "desc" : "asc" }))} className="mt-1 w-full rounded-lg bg-slate-50 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">{pSort.dir === "asc" ? "昇順 ↑" : "降順 ↓"}</button>
              <button onClick={() => setPSort({ key: "createdAt", dir: "desc" })} className="mt-1 w-full text-xs font-semibold text-bl-red hover:underline">リセット</button>
            </Dropdown>
            <Dropdown icon={<ColumnsIcon />} label="表示項目" width="w-64">
              <div className="mb-1.5 flex gap-3 border-b border-slate-100 pb-1.5">
                <button onClick={selectAllPcols} className="text-xs font-semibold text-bl-red hover:underline">すべて選択</button>
                <button onClick={clearPcols} className="text-xs font-semibold text-slate-500 hover:underline">クリア</button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {PCOLUMNS.map((c) => (
                  <label key={c.key} className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <input type="checkbox" checked={pcols.has(c.key)} onChange={() => togglePcol(c.key)} />{c.label}
                  </label>
                ))}
              </div>
            </Dropdown>
            <ExportBar compact filename="応募進捗" title="応募進捗一覧" getData={() => ({ headers: ["氏名", ...PCOLUMNS.map((c) => c.label)], rows: filtered.map((i) => [i.name, ...PCOLUMNS.map((c) => c.value(i))]) })} />
            {canBulkDelete && bulkSel.size > 0 && <button onClick={() => delApps([...bulkSel], `選択した${bulkSel.size}件の応募`)} disabled={delBusy} className="btn btn-ghost btn-sm gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" /></svg>選択削除（{bulkSel.size}）</button>}
            <span className="ml-auto text-sm text-slate-500">{filtered.length} 件</span>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            {loading ? <div className="p-10 text-center text-sm text-slate-400">読み込み中…</div>
              : filtered.length === 0 ? <div className="p-12 text-center text-sm text-slate-400">該当する応募がありません。</div>
              : (
                <table className="w-full table-fixed text-sm" style={{ minWidth: 240 + (canBulkDelete ? 44 : 0) + pvis.reduce((s, c) => s + c.w, 0) }}>
                  <colgroup>{canBulkDelete && <col style={{ width: 44 }} />}<col style={{ width: 200 }} />{pvis.map((c) => <col key={c.key} style={{ width: c.w }} />)}</colgroup>
                  <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    {canBulkDelete && <th className="px-3 py-2.5"><input type="checkbox" checked={filtered.length > 0 && filtered.every((i) => bulkSel.has(i.id))} onChange={() => setBulkSel((s) => (filtered.every((i) => s.has(i.id)) ? new Set() : new Set(filtered.map((i) => i.id))))} title="全選択" /></th>}
                    <th className="px-3 py-2.5">氏名</th>{pvis.map((c) => <th key={c.key} className="px-3 py-2.5">{c.label}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.map((i) => (
                      <tr key={i.id} onClick={() => select(i.id)} className={`h-[56px] cursor-pointer border-b border-slate-50 align-middle hover:bg-bl-redsoft/40 ${sel === i.id ? "bg-bl-redsoft/60" : ""}`}>
                        {canBulkDelete && <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={bulkSel.has(i.id)} onChange={() => toggleBulk(i.id)} /></td>}
                        <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={i.name} image={i.image} size={8} /><div className="min-w-0 truncate font-semibold text-ink" title={i.name}>{i.name}</div></div></td>
                        {pvis.map((c) => (
                          <td key={c.key} className="px-3 py-2">
                            {c.key === "status" ? <span className={`badge ${PIPE_TONE[bucket(i.status)]}`}>{PIPE_LABEL[bucket(i.status)]}</span>
                              : c.key === "staff" ? (i.staffName ? <span className="flex min-w-0 items-center gap-1.5"><Avatar name={i.staffName} image={i.staffImage} size={6} /><span className="truncate text-xs">{i.staffName}</span></span> : <span className="text-xs text-slate-300">未割当</span>)
                              : <span className="block truncate text-xs text-slate-600" title={c.value(i)}>{c.value(i) || <span className="text-slate-300">—</span>}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>

      {/* ===== Chi tiết ứng viên: modal đè lên ===== */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-2 sm:p-6" onClick={() => { setSel(null); setDetail(null); }}>
          <div className="my-2 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          {!detail ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">読み込み中…</div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 rounded-t-2xl border-b border-slate-100 bg-white p-4">
                <Avatar name={detail.candidate.name} image={detail.candidate.image} size={12} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-black text-ink">{detail.candidate.name}</div>
                  <div className="truncate text-xs text-slate-400">{detail.candidate.kana || "—"} ・ {detail.candidate.nationality ?? "—"}</div>
                </div>
                <span className={`badge ${PIPE_TONE[bucket(detail.status)]}`}>{PIPE_LABEL[bucket(detail.status)]}</span>
                {canRowDelete && <button onClick={() => delApps([detail.id], `「${detail.candidate.name}」の応募`)} disabled={delBusy} title="この応募を削除" className="shrink-0 rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" /></svg></button>}
                <button onClick={() => { setSel(null); setDetail(null); }} className="ml-1 shrink-0 text-slate-400 hover:text-ink" aria-label="閉じる"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
              </div>

              <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto p-4 lg:max-h-[70vh]">
                {/* Tiến trình 6 bước — GIỐNG HỆT phía ứng viên */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <StageTracker stage={STAGE_OF[detail.status] ?? 0} ended={isEnded(detail.status)} />
                </div>
                {/* ステータス + 担当者 */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">ステータス変更</span>
                    <select className={inputCls} disabled={!canEdit} value={bucket(detail.status)} onChange={(e) => patch({ status: e.target.value })}>
                      {PIPELINE_STATUSES.map((s) => <option key={s} value={s}>{PIPE_LABEL[s]}</option>)}
                    </select>
                  </label>
                  <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">担当者変更</span>
                    <select className={inputCls} disabled={!canEdit} value={detail.staffId ?? ""} onChange={(e) => patch({ staffId: e.target.value })}>
                      <option value="">未割当</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                </div>

                {/* 日程 */}
                <div>
                  <div className="mb-1.5 text-xs font-bold text-slate-500">日程</div>
                  <div className="grid grid-cols-2 gap-2">
                    {([["nextActionDate", "面談日"], ["interviewDate", "面接日"], ["offerDate", "内定日"], ["visaApplicationDate", "ビザ申請日"], ["joinDate", "入社日"]] as const).map(([k, label]) => (
                      <label key={k} className="block"><span className="mb-0.5 block text-[11px] text-slate-400">{label}</span>
                        <input type="date" className={inputCls} disabled={!canEdit} value={(detail as unknown as Record<string, string | null>)[k] ?? ""} onChange={(e) => patch({ [k]: e.target.value })} />
                      </label>
                    ))}
                  </div>
                </div>

                {/* 基本情報 */}
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-1.5 text-xs font-bold text-slate-500">基本情報</div>
                  <dl className="space-y-1 text-sm">
                    <Row k="電話番号" v={detail.candidate.phone} />
                    <Row k="メール" v={detail.candidate.email} />
                    <Row k="日本語" v={detail.candidate.japaneseLevel} />
                    <Row k="在留資格" v={detail.candidate.visaType} />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {detail.candidate.facebookUrl && <a href={detail.candidate.facebookUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-bl-blue hover:underline">Facebook</a>}
                      {detail.candidate.instagramUrl && <a href={detail.candidate.instagramUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-bl-blue hover:underline">Instagram</a>}
                      {detail.candidate.tiktokUrl && <a href={detail.candidate.tiktokUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-bl-blue hover:underline">TikTok</a>}
                    </div>
                  </dl>
                </div>

                {/* 求人情報 */}
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-1.5 text-xs font-bold text-slate-500">求人情報</div>
                  <div className="text-sm font-semibold text-ink">{detail.job.title}</div>
                  <div className="text-xs text-slate-500">{detail.job.code} ・ {detail.company} ・ {detail.job.location}{detail.job.city ? ` ${detail.job.city}` : ""}</div>
                  <Link href={`/admin/jobs/${detail.job.id}`} className="mt-1 inline-block text-xs font-semibold text-bl-blue hover:underline">求人を開く →</Link>
                </div>

                {/* CV / 書類 */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <span className="text-sm font-semibold text-ink">CV・履歴書・添付ファイル{detail.candidate.hasDocs ? "" : "（未提出）"}</span>
                  <Link href={`/admin/candidates/${detail.candidate.id}`} className="btn btn-ghost btn-sm border border-slate-200">応募者詳細・書類</Link>
                </div>

                {/* 進捗メモ（応募者に表示）— hiện ở timeline cả admin lẫn ứng viên */}
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    進捗メモを追加
                    <span className="rounded bg-bl-redsoft px-1.5 py-0.5 text-[10px] font-bold text-bl-red">応募者に表示</span>
                  </div>
                  <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} disabled={!canEdit} rows={2} className={`${inputCls} resize-none`} placeholder="応募者のマイページに表示されるメモ（次の予定・必要書類 など）…" />
                  {canEdit && <button onClick={async () => { const t = noteDraft.trim(); if (!t) return; await patch({ note: t }); setNoteDraft(""); }} className="btn btn-navy btn-sm mt-1.5">メモを追加</button>}
                </div>

                {/* 社内メモ（社内のみ・応募者には非表示） */}
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">社内メモ<span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">社内のみ</span></div>
                  <textarea value={memoDraft} onChange={(e) => setMemoDraft(e.target.value)} disabled={!canEdit} rows={3} className={`${inputCls} resize-none`} placeholder="社内向けメモ…" />
                  {canEdit && <button onClick={() => patch({ internalMemo: memoDraft })} className="btn btn-navy btn-sm mt-1.5">メモを保存</button>}
                </div>

                {/* メッセージ */}
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-1 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">最近のメッセージ</span><Link href={`/admin/messages`} className="text-xs font-semibold text-bl-blue hover:underline">メッセージ画面</Link></div>
                  <p className="line-clamp-2 text-sm text-slate-600">{detail.lastMessage || "（まだメッセージはありません）"}</p>
                  {canEdit && (
                    <div className="mt-2 flex items-end gap-2">
                      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={1} placeholder="日本語で送信…" className={`${inputCls} max-h-24 resize-none`} />
                      <button onClick={sendMessage} disabled={sending || !msg.trim()} className="btn btn-navy btn-sm disabled:opacity-50">送信</button>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <div className="mb-2 text-xs font-bold text-slate-500">タイムライン</div>
                  {detail.timeline.length === 0 ? <p className="text-xs text-slate-400">履歴がありません。</p> : (
                    <ol className="space-y-2.5">
                      {detail.timeline.map((t) => (
                        <li key={t.id} className="relative pl-4">
                          <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-bl-red" />
                          <div className="text-xs text-slate-400">{fmtDT(t.at)}{t.by ? ` ・ ${t.by}` : ""}</div>
                          <div className="text-sm text-ink">
                            {t.newStatus === "ASSIGN" || t.newStatus === "NOTE"
                              ? t.memo
                              : <>{t.oldStatus ? `${PIPE_LABEL[bucket(t.oldStatus)]} → ` : ""}<b>{PIPE_LABEL[bucket(t.newStatus)] ?? t.newStatus}</b> に変更{t.memo ? `（${t.memo}）` : ""}</>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return <div className="flex items-start justify-between gap-3"><dt className="shrink-0 text-xs text-slate-400">{k}</dt><dd className="truncate text-right text-sm font-semibold text-ink" title={v ?? ""}>{v || "—"}</dd></div>;
}
