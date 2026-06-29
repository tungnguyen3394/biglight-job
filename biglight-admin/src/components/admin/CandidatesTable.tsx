"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CandidateRow = {
  id: string;
  name: string;
  kana: string | null;
  image: string | null;
  nationality: string | null;
  phone: string | null;
  email: string | null;
  visaType: string | null;
  japaneseLevel: string | null;
  address: string | null;
  createdAt: string;
  lastActive: string;
  hasSNS: boolean;
  status: string;
  apps: number;
  online: boolean;
  // --- field bổ sung (đồng bộ form ứng viên マイページ) ---
  gender: string | null;
  birthdate: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  sswField: string | null;
  sswCategory: string | null;
  sswTask: string | null;
  otherSkills: string | null;
  desiredIndustry: string | null;
  desiredLocation: string | null;
  desiredSalary: number | null;
  desiredJobType: string | null;
  dorm: string | null;
  nightShiftWish: string | null;
  shiftWorkWish: string | null;
  startWork: string | null;
  arrival: string | null;
  reasons: string | null;
  priorities: string | null;
  changeJobFrom: string | null;
};

const PAGE = 20;
type Quick = "" | "thisWeek" | "incomplete" | "hasSNS";
const DAY = 86400000;

// Đầu tuần hiện tại (Thứ 2, 00:00 giờ địa phương).
function startOfWeek(): number {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}
// Hồ sơ chưa đủ: thiếu 1 trong 電話番号/国籍/在留資格/日本語/現在の住所.
function isIncomplete(r: CandidateRow): boolean {
  return !r.phone || !r.nationality || !r.visaType || !r.japaneseLevel || !r.address;
}

function Avatar({ name, image, ring }: { name: string; image: string | null; ring?: boolean }) {
  const r = ring ? "ring-2 ring-white" : "";
  if (image) return <img src={image} alt={name} className={`h-8 w-8 rounded-full object-cover ${r}`} />;
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy ${r}`}>{initial}</span>;
}

function uniq(list: (string | null)[]) {
  return Array.from(new Set(list.filter((x): x is string => !!x))).sort();
}

// Các cột có thể hiển thị / xuất CSV / in. w = độ rộng cố định (px).
type ColKey =
  | "name" | "kana" | "gender" | "birthdate" | "nationality" | "phone" | "email" | "facebook" | "instagram" | "tiktok"
  | "address" | "arrival" | "visaType" | "japaneseLevel" | "sswField" | "sswCategory" | "sswTask" | "otherSkills"
  | "desiredIndustry" | "desiredLocation" | "desiredSalary" | "desiredJobType" | "dorm" | "nightShift" | "shiftWork"
  | "startWork" | "changeJobFrom" | "reasons" | "priorities" | "apps" | "status" | "createdAt";
const yen10k = (n: number | null) => (n != null ? `${Math.round(n / 10000)}万円` : "");
const COLUMNS: { key: ColKey; label: string; w: number; value: (r: CandidateRow) => string }[] = [
  { key: "name", label: "氏名", w: 190, value: (r) => r.name || "" },
  { key: "kana", label: "フリガナ", w: 140, value: (r) => r.kana || "" },
  { key: "gender", label: "性別", w: 70, value: (r) => r.gender || "" },
  { key: "birthdate", label: "生年月日", w: 110, value: (r) => r.birthdate || "" },
  { key: "nationality", label: "国籍", w: 110, value: (r) => r.nationality || "" },
  { key: "phone", label: "電話番号", w: 135, value: (r) => r.phone || "" },
  { key: "email", label: "メール", w: 210, value: (r) => r.email || "" },
  { key: "facebook", label: "Facebook", w: 180, value: (r) => r.facebookUrl || "" },
  { key: "instagram", label: "Instagram", w: 180, value: (r) => r.instagramUrl || "" },
  { key: "tiktok", label: "TikTok", w: 180, value: (r) => r.tiktokUrl || "" },
  { key: "address", label: "現在の住所", w: 120, value: (r) => r.address || "" },
  { key: "arrival", label: "来日年月日", w: 110, value: (r) => r.arrival || "" },
  { key: "visaType", label: "在留資格", w: 160, value: (r) => r.visaType || "" },
  { key: "japaneseLevel", label: "日本語", w: 84, value: (r) => r.japaneseLevel || "" },
  { key: "sswField", label: "特定技能分野", w: 140, value: (r) => r.sswField || "" },
  { key: "sswCategory", label: "業務区分", w: 130, value: (r) => r.sswCategory || "" },
  { key: "sswTask", label: "従事する業務", w: 150, value: (r) => r.sswTask || "" },
  { key: "otherSkills", label: "その他スキル", w: 160, value: (r) => r.otherSkills || "" },
  { key: "desiredIndustry", label: "希望業種", w: 140, value: (r) => r.desiredIndustry || "" },
  { key: "desiredLocation", label: "希望勤務地", w: 140, value: (r) => r.desiredLocation || "" },
  { key: "desiredSalary", label: "希望給与", w: 100, value: (r) => yen10k(r.desiredSalary) },
  { key: "desiredJobType", label: "希望職種", w: 130, value: (r) => r.desiredJobType || "" },
  { key: "dorm", label: "寮", w: 100, value: (r) => r.dorm || "" },
  { key: "nightShift", label: "夜勤", w: 90, value: (r) => r.nightShiftWish || "" },
  { key: "shiftWork", label: "交替勤務", w: 90, value: (r) => r.shiftWorkWish || "" },
  { key: "startWork", label: "入社時期", w: 110, value: (r) => r.startWork || "" },
  { key: "changeJobFrom", label: "転職可能時期", w: 120, value: (r) => r.changeJobFrom || "" },
  { key: "reasons", label: "転職理由", w: 200, value: (r) => r.reasons || "" },
  { key: "priorities", label: "重視すること", w: 180, value: (r) => r.priorities || "" },
  { key: "apps", label: "応募数", w: 76, value: (r) => String(r.apps) },
  { key: "status", label: "ステータス", w: 96, value: (r) => r.status },
  { key: "createdAt", label: "登録日", w: 110, value: (r) => r.createdAt.slice(0, 10) },
];
const DEFAULT_COLS: ColKey[] = ["name", "nationality", "phone", "email", "visaType", "japaneseLevel", "createdAt", "status"];
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Sắp xếp nâng cao (đa trường, ưu tiên theo thứ tự).
type SortField = "createdAt" | "lastActive" | "name" | "nationality" | "visaType" | "japaneseLevel" | "apps" | "status";
type SortItem = { key: SortField; dir: "asc" | "desc" };
const SORT_FIELDS: { key: SortField; label: string; cmp: (a: CandidateRow, b: CandidateRow) => number }[] = [
  { key: "createdAt", label: "登録日", cmp: (a, b) => a.createdAt.localeCompare(b.createdAt) },
  { key: "lastActive", label: "最終利用", cmp: (a, b) => a.lastActive.localeCompare(b.lastActive) },
  { key: "name", label: "氏名（カナ）", cmp: (a, b) => (a.kana || a.name).localeCompare(b.kana || b.name, "ja") },
  { key: "nationality", label: "国籍", cmp: (a, b) => (a.nationality || "").localeCompare(b.nationality || "", "ja") },
  { key: "visaType", label: "在留資格", cmp: (a, b) => (a.visaType || "").localeCompare(b.visaType || "", "ja") },
  { key: "japaneseLevel", label: "日本語", cmp: (a, b) => (a.japaneseLevel || "").localeCompare(b.japaneseLevel || "") },
  { key: "apps", label: "応募数", cmp: (a, b) => a.apps - b.apps },
  { key: "status", label: "ステータス", cmp: (a, b) => a.status.localeCompare(b.status, "ja") },
];
const SORT_LABEL = (k: SortField) => SORT_FIELDS.find((f) => f.key === k)?.label ?? k;

export function CandidatesTable({ rows }: { rows: CandidateRow[] }) {
  const [q, setQ] = useState("");
  const [fNat, setFNat] = useState("");
  const [fVisa, setFVisa] = useState("");
  const [fJp, setFJp] = useState("");
  const [sortList, setSortList] = useState<SortItem[]>([{ key: "createdAt", dir: "desc" }]);
  const [quick, setQuick] = useState<Quick>("");
  const [page, setPage] = useState(0);
  const [cols, setCols] = useState<Set<ColKey>>(() => new Set(DEFAULT_COLS));
  const visCols = COLUMNS.filter((c) => cols.has(c.key));
  const toggleCol = (k: ColKey) => setCols((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const selectAllCols = () => setCols(new Set(COLUMNS.map((c) => c.key)));
  const clearCols = () => setCols(new Set(["name"]));

  // ----- chọn để gửi mail (GAS) -----
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
    // 1) Server: kiểm quyền + gom email + lấy GAS URL của chính nhân viên.
    const r = await fetch("/api/admin/candidates/mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setSending(false); setConfirming(false); setSendMsg(j.error || "送信に失敗しました。"); return; }
    // 2) Trình duyệt nhân viên → GAS (đã đăng nhập Google nên không bị 403). no-cors → response opaque.
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

  const nats = useMemo(() => uniq(rows.map((r) => r.nationality)), [rows]);
  const visas = useMemo(() => uniq(rows.map((r) => r.visaType)), [rows]);
  const jps = useMemo(() => uniq(rows.map((r) => r.japaneseLevel)), [rows]);

  // ----- số liệu cho dashboard mini -----
  const insight = useMemo(() => {
    const wk = startOfWeek();
    const now = Date.now();
    const newThisWeek = rows.filter((r) => new Date(r.createdAt).getTime() >= wk).length;
    const incomplete = rows.filter(isIncomplete).length;
    const sns = rows.filter((r) => r.hasSNS).length;
    const active = rows.filter((r) => now - new Date(r.lastActive).getTime() < 14 * DAY).length;
    const topActive = [...rows].sort((a, b) => b.lastActive.localeCompare(a.lastActive)).slice(0, 5);
    return { newThisWeek, incomplete, sns, active, topActive };
  }, [rows]);

  const reset = () => setPage(0);
  const toggleQuick = (k: Quick) => { setQuick((p) => (p === k ? "" : k)); reset(); };

  const filtered = useMemo(() => {
    const wk = startOfWeek();
    let out = rows.filter((r) => {
      if (fNat && r.nationality !== fNat) return false;
      if (fVisa && r.visaType !== fVisa) return false;
      if (fJp && r.japaneseLevel !== fJp) return false;
      if (quick === "thisWeek" && new Date(r.createdAt).getTime() < wk) return false;
      if (quick === "incomplete" && !isIncomplete(r)) return false;
      if (quick === "hasSNS" && !r.hasSNS) return false;
      if (q) {
        const t = `${r.name}${r.kana ?? ""}${r.phone ?? ""}${r.email ?? ""}${r.nationality ?? ""}${r.visaType ?? ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    const cmps = sortList.map((s) => ({ cmp: SORT_FIELDS.find((f) => f.key === s.key)!.cmp, dir: s.dir }));
    out = [...out].sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1; // người đang online luôn lên đầu
      for (const { cmp, dir } of cmps) { let r = cmp(a, b); if (dir === "desc") r = -r; if (r !== 0) return r; }
      return 0;
    });
    return out;
  }, [rows, q, fNat, fVisa, fJp, sortList, quick]);

  const emailRows = filtered.filter((r) => r.email);
  const allSelected = emailRows.length > 0 && emailRows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(emailRows.map((r) => r.id)));

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const view = filtered.slice(cur * PAGE, cur * PAGE + PAGE);

  const QUICK_LABEL: Record<Exclude<Quick, "">, string> = {
    thisWeek: "今週の新規登録",
    incomplete: "プロフィール未完成",
    hasSNS: "SNS登録あり",
  };

  // ----- xuất CSV (theo cột hiển thị + kết quả đã lọc) -----
  function exportCsv() {
    const header = visCols.map((c) => c.label);
    const body = filtered.map((r) => visCols.map((c) => c.value(r)));
    const csv = [header, ...body].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `応募者一覧_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // ----- in (mở cửa sổ in với bảng đã lọc) -----
  function printList() {
    const w = window.open("", "_blank");
    if (!w) return;
    const head = visCols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
    const body = filtered.map((r) => `<tr>${visCols.map((c) => `<td>${escapeHtml(c.value(r))}</td>`).join("")}</tr>`).join("");
    w.document.write(`<!doctype html><meta charset="utf-8"><title>応募者一覧</title><style>body{font-family:'Noto Sans JP',sans-serif;padding:20px;color:#16181d}h1{font-size:18px;margin:0 0 4px}.meta{color:#6b7280;font-size:12px;margin-bottom:10px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f3f4f6}</style><h1>応募者一覧（${filtered.length}名）</h1><div class="meta">${new Date().toLocaleString("ja-JP")}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
    w.document.close(); w.focus(); w.print();
  }

  function renderCell(key: ColKey, r: CandidateRow) {
    switch (key) {
      case "name":
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {r.online && <span className="h-2 w-2 flex-none rounded-full bg-emerald-500" title="オンライン（最近ログイン）" />}
              <Link href={`/admin/candidates/${r.id}`} className="block truncate font-semibold text-navy hover:underline" title={r.name}>{r.name || "（未入力）"}</Link>
            </div>
            <div className="truncate text-xs text-slate-400" title={r.kana ?? ""}>{r.kana || "—"}</div>
          </div>
        );
      case "email":
        return <span className="block truncate" title={r.email ?? ""}>{r.email ?? "—"}</span>;
      case "status":
        return <span className="badge bg-slate-100 text-slate-600">{r.status}</span>;
      case "createdAt":
        return <span className="block truncate text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("ja-JP")}</span>;
      default: {
        const v = COLUMNS.find((c) => c.key === key)?.value(r) ?? "";
        return <span className="block truncate" title={v}>{v || "—"}</span>;
      }
    }
  }

  const activeFilters = [fNat, fVisa, fJp].filter(Boolean).length;
  const tableWidth = 72 + visCols.reduce((s, c) => s + c.w, 0) + 84;

  return (
    <div>
      {/* ===== Dashboard mini (insight) ===== */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightCard
          icon={<><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5 1 0 2 .2 2.8.6" /><path d="M17 8v6M14 11h6" /></>}
          label="今週の新規登録" value={insight.newThisWeek}
          actionLabel="今週の新規を見る" active={quick === "thisWeek"} onAction={() => toggleQuick("thisWeek")}
        />
        <InsightCard
          icon={<><path d="M3 12h4l2 6 4-14 2 8h6" /></>}
          label="アクティブユーザー" value={insight.active} sub="直近14日"
          actionLabel="アクティブ順に並べる" active={sortList.length === 1 && sortList[0].key === "lastActive"} onAction={() => setSortList([{ key: "lastActive", dir: "desc" }])}
        >
          <div className="mt-2 flex -space-x-2">
            {insight.topActive.map((r) => (
              <Link key={r.id} href={`/admin/candidates/${r.id}`} title={r.name} className="transition hover:-translate-y-0.5">
                <Avatar name={r.name} image={r.image} ring />
              </Link>
            ))}
          </div>
        </InsightCard>
        <InsightCard
          icon={<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>}
          label="プロフィール未完成" value={insight.incomplete} accent
          actionLabel="未完成を見る" active={quick === "incomplete"} onAction={() => toggleQuick("incomplete")}
        />
        <InsightCard
          icon={<><path d="M18 8a3 3 0 1 0-2.8-4M6 12a3 3 0 1 0 0 .01M18 16a3 3 0 1 0-2.8 4M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>}
          label="SNS登録あり" value={insight.sns}
          actionLabel="SNSありを見る" active={quick === "hasSNS"} onAction={() => toggleQuick("hasSNS")}
        />
      </div>

      <div className="card">
      {/* quick filter chip */}
      {quick && (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bl-redsoft px-2.5 py-1 font-semibold text-bl-red">
            絞り込み：{QUICK_LABEL[quick]}
            <button onClick={() => { setQuick(""); reset(); }} className="text-bl-red/70 hover:text-bl-red">✕</button>
          </span>
        </div>
      )}
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <div className="relative max-w-xs flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input className="input pl-9" placeholder="氏名・電話・メールで検索" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />
        </div>

        {/* 絞り込み (gom các bộ lọc) */}
        <details className="relative">
          <summary className="btn btn-ghost btn-sm cursor-pointer list-none gap-1 [&::-webkit-details-marker]:hidden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
            絞り込み{activeFilters > 0 && <span className="rounded-full bg-bl-red px-1.5 text-[10px] font-bold text-white">{activeFilters}</span>}
          </summary>
          <div className="absolute left-0 z-30 mt-1 w-64 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <div><div className="mb-1 text-xs font-bold text-slate-500">国籍</div><select className="input w-full" value={fNat} onChange={(e) => { setFNat(e.target.value); reset(); }}><option value="">すべて</option>{nats.map((n) => <option key={n}>{n}</option>)}</select></div>
            <div><div className="mb-1 text-xs font-bold text-slate-500">在留資格</div><select className="input w-full" value={fVisa} onChange={(e) => { setFVisa(e.target.value); reset(); }}><option value="">すべて</option>{visas.map((v) => <option key={v}>{v}</option>)}</select></div>
            <div><div className="mb-1 text-xs font-bold text-slate-500">日本語</div><select className="input w-full" value={fJp} onChange={(e) => { setFJp(e.target.value); reset(); }}><option value="">すべて</option>{jps.map((j) => <option key={j}>{j}</option>)}</select></div>
            {activeFilters > 0 && <button onClick={() => { setFNat(""); setFVisa(""); setFJp(""); reset(); }} className="text-xs font-semibold text-bl-red hover:underline">フィルターをクリア</button>}
          </div>
        </details>

        {/* 並び替え nâng cao (đa trường) */}
        <details className="relative">
          <summary className="btn btn-ghost btn-sm cursor-pointer list-none gap-1 [&::-webkit-details-marker]:hidden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" /></svg>
            並び替え{sortList.length > 0 && <span className="rounded-full bg-slate-200 px-1.5 text-[10px] font-bold text-slate-600">{sortList.length}</span>}
          </summary>
          <div className="absolute left-0 z-30 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            {sortList.length === 0 && <p className="mb-2 text-xs text-slate-400">並び替え項目がありません。</p>}
            {sortList.map((s, i) => (
              <div key={s.key} className="mb-1.5 flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1.5">
                <span className="w-4 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                <span className="flex-1 truncate text-sm font-semibold text-ink">{SORT_LABEL(s.key)}</span>
                <button onClick={() => toggleDir(s.key)} className={`rounded px-2 py-0.5 text-[11px] font-bold ${s.dir === "asc" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>{s.dir === "asc" ? "昇順" : "降順"}</button>
                <button onClick={() => moveSort(i, -1)} disabled={i === 0} className="px-0.5 text-slate-300 hover:text-bl-red disabled:opacity-30" aria-label="上へ"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 15 6-6 6 6" /></svg></button>
                <button onClick={() => moveSort(i, 1)} disabled={i === sortList.length - 1} className="px-0.5 text-slate-300 hover:text-bl-red disabled:opacity-30" aria-label="下へ"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg></button>
                <button onClick={() => removeSort(s.key)} className="px-0.5 text-slate-300 hover:text-red-500" aria-label="削除">✕</button>
              </div>
            ))}
            {availableSort.length > 0 && (
              <select value="" onChange={(e) => { const v = e.target.value; if (v) addSort(v as SortField); e.currentTarget.value = ""; }} className="input mt-1 w-full text-sm">
                <option value="">＋ 並び替え項目を追加</option>
                {availableSort.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            )}
            {sortList.length > 0 && <button onClick={() => setSortList([])} className="mt-2 text-xs font-semibold text-bl-red hover:underline">並び替えをクリア</button>}
          </div>
        </details>

        <div className="ml-auto flex items-center gap-2">
          {/* 表示項目 */}
          <details className="relative">
            <summary className="btn btn-ghost btn-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden">表示項目</summary>
            <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="mb-1 flex gap-3 border-b border-slate-100 px-1 pb-1.5">
                <button onClick={selectAllCols} className="text-xs font-semibold text-bl-red hover:underline">すべて選択</button>
                <button onClick={clearCols} className="text-xs font-semibold text-slate-500 hover:underline">クリア</button>
              </div>
              {COLUMNS.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={cols.has(c.key)} onChange={() => toggleCol(c.key)} className="h-3.5 w-3.5 accent-bl-red" />
                  {c.label}
                </label>
              ))}
            </div>
          </details>
          <button onClick={exportCsv} className="btn btn-ghost btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>CSV</button>
          <button onClick={printList} className="btn btn-ghost btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>印刷</button>
          <button onClick={() => selected.size && setMailOpen(true)} disabled={selected.size === 0} className="btn btn-navy btn-sm gap-1 disabled:opacity-40"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="m22 6-10 7L2 6" /></svg>メール送信{selected.size > 0 && `（${selected.size}）`}</button>
          <span className="text-sm text-slate-500">{filtered.length} 名</span>
        </div>
      </div>

      {/* table — table-fixed: cột rộng cố định, nội dung dài rút gọn “…”, mỗi dòng đều nhau */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm" style={{ minWidth: tableWidth }}>
          <colgroup>
            <col style={{ width: 72 }} />
            {visCols.map((c) => <col key={c.key} style={{ width: c.w }} />)}
            <col style={{ width: 84 }} />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-3 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} title="メールありを全選択" className="h-3.5 w-3.5 accent-bl-red" /></th>
              {visCols.map((c) => <th key={c.key} className="truncate px-3 py-2.5">{c.label}</th>)}
              <th className="px-3 py-2.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} className="h-[52px] border-b border-slate-50 align-middle hover:bg-slate-50">
                <td className="px-3 py-2"><div className="flex items-center gap-1.5"><input type="checkbox" checked={selected.has(r.id)} disabled={!r.email} onChange={() => toggleSel(r.id)} title={r.email ? "選択" : "メール未登録"} className="h-3.5 w-3.5 accent-bl-red disabled:opacity-30" /><Avatar name={r.name} image={r.image} /></div></td>
                {visCols.map((c) => <td key={c.key} className="px-3 py-2">{renderCell(c.key, r)}</td>)}
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/candidates/${r.id}`} className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-blue hover:underline">
                    詳細
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </Link>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr><td colSpan={visCols.length + 2} className="p-10 text-center text-slate-400">該当する応募者がいません</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-3 text-sm">
          <span className="text-slate-500">{cur * PAGE + 1}–{Math.min((cur + 1) * PAGE, filtered.length)} / {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button disabled={cur === 0} onClick={() => setPage(cur - 1)} className="btn btn-ghost px-3 py-1.5 disabled:opacity-40">前へ</button>
            <span className="px-2 text-slate-600">{cur + 1} / {pages}</span>
            <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="btn btn-ghost px-3 py-1.5 disabled:opacity-40">次へ</button>
          </div>
        </div>
      )}
      </div>

      {/* Modal soạn mail (gửi qua GAS) */}
      {mailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !sending && setMailOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-ink">メール送信（{selected.size}名）</h3>
              <button onClick={() => setMailOpen(false)} className="text-slate-400 hover:text-ink"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
            </div>
            <p className="mb-3 text-xs text-slate-500">選択した応募者のメールアドレス宛に送信します。返信先はあなた（{/* staff email server-side */}ログイン中のスタッフ）になります。</p>
            <label className="mb-1 block text-xs font-bold text-slate-500">件名</label>
            <input value={subject} onChange={(e) => { setSubject(e.target.value); setConfirming(false); }} className="input mb-3 w-full" placeholder="件名を入力" />
            <label className="mb-1 block text-xs font-bold text-slate-500">本文</label>
            <textarea value={body} onChange={(e) => { setBody(e.target.value); setConfirming(false); }} rows={8} className="input w-full" placeholder="本文を入力…" />
            {sendMsg && <p className={`mt-2 text-sm font-semibold ${sendMsg.includes("送信しました") ? "text-emerald-600" : "text-red-600"}`}>{sendMsg}</p>}
            {confirming && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                選択した{selected.size}名のメールアドレスへ送信します。送信後は取り消せません。よろしいですか？
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

function InsightCard({
  icon, label, value, sub, actionLabel, onAction, active, accent, children,
}: {
  icon: React.ReactNode; label: string; value: number; sub?: string;
  actionLabel: string; onAction: () => void; active?: boolean; accent?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition ${active ? "border-bl-red ring-1 ring-bl-red" : "border-slate-200"}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-bl-redsoft text-bl-red" : "bg-slate-100 text-slate-500"}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </span>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-3xl font-black leading-none ${accent ? "text-bl-red" : "text-ink"}`}>{value}</span>
        {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
        <span className="text-xs text-slate-400">名</span>
      </div>
      {children}
      <button
        onClick={onAction}
        className={`mt-3 inline-flex w-fit items-center gap-1 text-xs font-bold transition ${active ? "text-bl-red" : "text-slate-500 hover:text-bl-red"}`}
      >
        {actionLabel}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  );
}
