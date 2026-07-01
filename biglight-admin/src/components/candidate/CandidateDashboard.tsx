"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CandidateProfileForm, { type ProfileInit, type FieldOptions } from "./CandidateProfileForm";
import type { SswField } from "@/lib/sswJobs";
import CandidateMessages from "./CandidateMessages";
import { type DocMap } from "./CandidateDocuments";
import { StageTracker, StageTimeline } from "@/components/common/StageTracker";
import { type FlowEvent } from "@/lib/applicationFlow";

export type AppView = { id: string; jobId: string; code: string; title: string; company: string; stage: number; statusLabel: string; ended: boolean; timeline: FlowEvent[] };
export type SavedJob = { id: string; title: string; industry: string; location: string; city: string | null; salaryMain: string | null };

type SecKey = "profile" | "apps" | "saved" | "messages" | "settings";

// Icon line (SVG) — gọn, không dùng emoji
function Ic({ d, size = 18, sw = 2 }: { d: React.ReactNode; size?: number; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}
const ICONS: Record<string, React.ReactNode> = {
  profile: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  apps: <><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>,
  saved: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.5 1-1a5.5 5.5 0 0 0 0-7.7z" />,
  messages: <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" />,
  salary: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M9 11l3 3 3-3M12 10v6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  jobs: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  guide: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
  pin: <><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  yen: <><path d="M12 4l5 7M12 4 7 11M12 11v9M8 13h8M8 16.5h8" /></>,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
};

// 4 mục chính theo thứ tự yêu cầu
const ITEMS: { key: SecKey; label: string }[] = [
  { key: "profile", label: "プロフィール入力" },
  { key: "apps", label: "応募状況・進捗" },
  { key: "saved", label: "お気に入り求人" },
  { key: "messages", label: "メッセージ" },
];

// Drawer: CHỈ mục phụ + tiện ích (ホーム/求人/ガイド/マイページ đã có ở footer → không lặp).
type DrawerItem = { label: string; icon: React.ReactNode; sec?: SecKey; href?: string; ext?: boolean; logout?: boolean; gray?: boolean };
const GROUPS: { title: string; items: DrawerItem[] }[] = [
  { title: "応募・活動", items: [
    { label: "お気に入り", icon: ICONS.saved, sec: "saved" },
    { label: "メッセージ", icon: ICONS.messages, sec: "messages" },
    { label: "応募履歴", icon: ICONS.apps, sec: "apps" },
  ] },
  { title: "便利機能", items: [
    { label: "手取り計算", icon: ICONS.salary, href: "/biglight-job-salary.html", ext: true },
  ] },
  { title: "その他", items: [
    { label: "設定", icon: ICONS.settings, sec: "settings" },
    { label: "ログアウト", icon: ICONS.logout, logout: true, gray: true },
  ] },
];

export default function CandidateDashboard({ name, apps, applied, profile, docs, saved, emailLocked, complete = true, needProfile, initialSec, fieldOptions, sswTree }: { name: string; apps: AppView[]; applied?: boolean; profile: ProfileInit; docs: DocMap; saved: SavedJob[]; emailLocked?: boolean; complete?: boolean; needProfile?: boolean; initialSec?: string; fieldOptions?: FieldOptions; sswTree?: SswField[] }) {
  const router = useRouter();
  const validSec = (["profile", "apps", "saved", "messages", "settings"] as const).find((k) => k === initialSec);
  const [sec, setSec] = useState<SecKey>(validSec ?? (needProfile || !complete ? "profile" : applied ? "apps" : "profile"));
  // Khi URL đổi ?sec=... (vd bấm nút メッセージ ở header lúc đang ở マイページ) → mở đúng tab.
  useEffect(() => {
    const v = (["profile", "apps", "saved", "messages", "settings"] as const).find((k) => k === initialSec);
    if (v) setSec(v);
  }, [initialSec]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState(needProfile ? "応募する前にプロフィールを完成してください。" : "");
  const [drawer, setDrawer] = useState(false); // mobile: sidebar dạng drawer

  // các trường bắt buộc còn thiếu (để hiện banner ở mục プロフィール入力)
  const missing: string[] = [];
  if (!profile.name?.trim()) missing.push("お名前");
  if (!profile.birth) missing.push("生年月日");
  if (profile.gender !== "MALE" && profile.gender !== "FEMALE") missing.push("性別");
  if (!profile.nat?.trim()) missing.push("国籍");
  if (!profile.visa?.trim()) missing.push("現在の在留資格");
  if (!profile.facebookUrl?.trim() && !profile.instagramUrl?.trim() && !profile.tiktokUrl?.trim()) missing.push("SNSアカウント");
  if (!emailLocked && !profile.email?.trim()) missing.push("メールアドレス");
  // % hoàn thành hồ sơ (mẫu số = số trường 必須 đang kiểm tra)
  const totalReq = emailLocked ? 6 : 7;
  const canApply = missing.length === 0;
  // 1 thanh duy nhất: 必須 lấp tới mốc 60% (= 応募可能); 任意 lấp 60→100% (= AIマッチング cao hơn)
  const optList: unknown[] = [
    profile.kana?.trim(), profile.phone?.trim(), profile.address?.trim(), profile.jp?.trim(),
    profile.sswField?.trim(), profile.desiredJobType?.trim(), profile.workHistory?.length, profile.start?.trim(), profile.dorm?.trim(),
    profile.fields?.length, profile.areas?.length, profile.sal > 0 ? 1 : 0, profile.reasons?.length, profile.priorities?.length,
  ];
  const reqRatio = (totalReq - missing.length) / totalReq;
  const optRatio = optList.filter(Boolean).length / optList.length;
  const pct = Math.max(0, Math.min(100, Math.round(reqRatio * 60 + optRatio * 40)));
  const stars = Math.max(1, Math.min(5, Math.round(pct / 20)));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }
  async function unsave(id: string) {
    setBusy(id);
    await fetch("/api/candidate/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
    router.refresh();
  }
  async function apply(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/candidate/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
      setBusy(null);
      if (res.status === 422) { setNotice("応募する前にプロフィールを完成してください。"); setSec("profile"); return; }
      if (!res.ok) { setNotice("応募に失敗しました。しばらくして再度お試しください。"); return; } // không còn báo "thành công" giả
      setSec("apps");
      router.refresh();
    } catch { setBusy(null); setNotice("応募に失敗しました。通信状態をご確認ください。"); }
  }
  async function cancelApp(jobId: string) {
    setBusy(jobId);
    await fetch("/api/candidate/apply", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
    router.refresh();
  }
  const heading = sec === "settings" ? "アカウント設定" : ITEMS.find((i) => i.key === sec)?.label ?? "";

  // nút điều hướng dùng chung
  // Đổi tab: cập nhật state ngay (mượt) + đồng bộ URL ?sec= để nút メッセージ ở header luôn điều hướng đúng.
  const go = (key: SecKey) => { setSec(key); setNotice(""); router.replace(`/mypage?sec=${key}`, { scroll: false }); };
  const navBtn = (key: SecKey, label: string, vertical: boolean) =>
    vertical ? (
      <button key={key} onClick={() => go(key)} className={`mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${sec === key ? "bg-bl-redsoft text-bl-red" : "text-bl-gray hover:bg-bl-bg hover:text-ink"}`}>
        <Ic d={ICONS[key]} />{label}
      </button>
    ) : (
      <button key={key} data-sec={key} onClick={() => go(key)} className={`flex flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-center text-[10px] font-bold leading-tight transition ${sec === key ? "bg-white text-bl-red shadow-sm" : "text-bl-gray2 hover:bg-white/60"}`}>
        <Ic d={ICONS[key]} size={22} /><span className="break-keep">{label}</span>
      </button>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header (Apple Settings): ☰ to ở góc trái + tiêu đề lớn */}
      <div className="mb-3 flex items-center gap-1">
        <button onClick={() => setDrawer(true)} aria-label="メニュー" className="-ml-2 flex h-11 w-11 flex-none items-center justify-center rounded-xl text-ink hover:bg-bl-bg lg:hidden">
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="truncate text-xl font-black text-ink">{heading || "マイページ"}</h1>
      </div>

      {/* Một thanh duy nhất: プロフィール % + mốc 応募可能 + AIマッチング */}
      <div className="mb-3 rounded-2xl border border-bl-line bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">プロフィール</span>
          <span className="text-sm font-black text-ink">{pct}%</span>
        </div>
        <div className="relative mb-2.5 mt-2 h-2.5 w-full overflow-hidden rounded-full bg-bl-line">
          <div className="h-full rounded-full bg-[#13335c] transition-all duration-500" style={{ width: `${pct}%` }} />
          {/* mốc 応募可能 (60%) */}
          <span className="absolute top-0 h-full w-[2px] -translate-x-1/2 bg-white" style={{ left: "60%" }} />
        </div>
        <div className="flex items-center justify-between text-xs">
          {canApply
            ? <span className="flex items-center gap-1 font-bold text-bl-green"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>応募できます</span>
            : <button onClick={() => go("profile")} className="font-bold text-bl-red">あと{missing.length}項目 →</button>}
          <span className="text-bl-gray2">おすすめ度 <span className="text-bl-red">{"★".repeat(stars)}</span><span className="text-bl-line">{"★".repeat(5 - stars)}</span></span>
        </div>
      </div>

      {/* Thông báo xanh — gọn 1 dòng, icon check nhỏ */}
      {applied && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-bl-green/50 bg-bl-greensoft px-4 py-3 text-[13px] font-semibold text-bl-green">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-none"><path d="M20 6 9 17l-5-5" /></svg>
          <span className="min-w-0 flex-1">応募を受け付けました。担当者がご連絡します。</span>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[230px_1fr] lg:items-start lg:gap-6">
        {/* ===== Mobile: drawer Minimal (trượt từ trái) + overlay ===== */}
        <div className={`fixed inset-0 z-50 lg:hidden ${drawer ? "" : "pointer-events-none"}`} aria-hidden={!drawer}>
          <div onClick={() => setDrawer(false)} className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0"}`} />
          <div className={`absolute left-0 top-0 flex h-full w-[300px] max-w-[86vw] flex-col bg-white transition-transform duration-300 ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
            {/* Đầu: avatar + tên + % */}
            <div className="flex items-center gap-3 px-5 pb-4 pt-5">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-bl-redsoft text-base font-black text-bl-red">{name?.trim()?.[0] ?? "?"}</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-ink">{name} さん</div>
                <div className="text-xs text-bl-gray2">プロフィール {pct}%</div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-1">
              {GROUPS.map((g) => (
                <div key={g.title} className="mb-5">
                  <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-bl-gray2">{g.title}</div>
                  {g.items.map((it) => {
                    const active = !!it.sec && it.sec === sec;
                    const cls = `flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left text-[15px] font-semibold transition ${it.gray ? "text-bl-gray2 hover:bg-bl-bg" : active ? "text-bl-red" : "text-ink hover:bg-bl-bg"}`;
                    const inner = <><Ic d={it.icon} size={20} sw={1.7} />{it.label}</>;
                    if (it.logout) return <button key={it.label} onClick={() => { setDrawer(false); logout(); }} className={cls}>{inner}</button>;
                    if (it.sec) return <button key={it.label} onClick={() => { go(it.sec!); setDrawer(false); }} className={cls}>{inner}</button>;
                    return <a key={it.label} href={it.href} target={it.ext ? "_blank" : undefined} rel={it.ext ? "noopener noreferrer" : undefined} onClick={() => setDrawer(false)} className={cls}>{inner}</a>;
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* ===== Desktop: sidebar dọc (chỉ desktop) ===== */}
        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <nav className="rounded-2xl border border-bl-line bg-white p-2">
            {ITEMS.map((it) => navBtn(it.key, it.label, true))}
            <a href="/biglight-job-salary.html" target="_blank" rel="noopener noreferrer" className="mt-1 flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-br from-bl-red to-bl-redd px-3 py-2.5 text-left text-sm font-bold text-white">
              <Ic d={ICONS.salary} />手取り計算ツール
            </a>
            {navBtn("settings", "アカウント設定", true)}
            <button onClick={logout} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-bl-gray2 hover:bg-bl-bg hover:text-bl-red">
              <Ic d={ICONS.logout} />ログアウト
            </button>
          </nav>
        </aside>

        {/* ===== Nội dung (mobile full width) ===== */}
        <div className="min-w-0">

          {notice && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
              <Ic d={<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>} />{notice}
            </div>
          )}

          {/* プロフィール入力（提出書類を含む） */}
          {sec === "profile" && (
            <>
              {missing.length > 0 && (
                <div className="mb-4 rounded-2xl border border-bl-line bg-[#FFF8E7] p-4 text-sm">
                  <b className="text-ink">応募するには、次の必須項目を入力してください：</b>
                  <p className="mt-1 font-semibold text-bl-red">{missing.join("・")}</p>
                </div>
              )}
              <CandidateProfileForm init={profile} initDocs={docs} emailLocked={emailLocked} options={fieldOptions} sswTree={sswTree} />
            </>
          )}

          {/* 応募状況・進捗 */}
          {sec === "apps" && (
            apps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-bl-line bg-white p-10 text-center text-bl-gray2">まだ応募はありません。お気に入りから「応募する」を押すとここに表示されます。<Link href="/" className="mt-2 block font-semibold text-bl-red">求人を探す →</Link></div>
            ) : (
              <div className="space-y-4">
                {apps.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-bl-bg px-2 py-0.5 text-xs font-bold text-bl-gray">{a.code}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${a.ended ? "bg-bl-line text-bl-gray" : "bg-bl-redsoft text-bl-red"}`}>{a.statusLabel}</span>
                      <h3 className="ml-1 text-base font-bold">{a.title}</h3>
                    </div>
                    <StageTracker stage={a.stage} ended={a.ended} />
                    {/* Tiến trình chi tiết — mỗi bước kèm ghi chú từ担当者 */}
                    <div className="mt-4 border-t border-bl-line pt-3">
                      <p className="mb-2 text-xs font-black text-bl-gray2">進捗の記録</p>
                      <StageTimeline events={a.timeline} />
                    </div>
                    {!a.ended && (
                      <div className="mt-3 border-t border-bl-line pt-3">
                        <button onClick={() => cancelApp(a.jobId)} disabled={busy === a.jobId} className="text-xs font-bold text-bl-gray2 hover:text-bl-red disabled:opacity-50">
                          {busy === a.jobId ? "処理中…" : "応募を取り消す（お気に入りに戻す）"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* お気に入り求人 */}
          {sec === "saved" && (
            saved.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-bl-line bg-white p-10 text-center text-bl-gray2">まだお気に入りはありません。<Link href="/" className="mt-2 block font-semibold text-bl-red">求人を探す →</Link></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {saved.map((j) => (
                  <div key={j.id} className="flex flex-col rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-2">
                      <Link href={`/jobs/${j.id}`} className="min-w-0 flex-1">
                        <span className="rounded-full bg-bl-bluesoft px-2 py-0.5 text-[11px] font-bold text-bl-blue">{j.industry}</span>
                        <h3 className="mt-1.5 text-sm font-bold leading-snug">{j.title}</h3>
                        {j.salaryMain && <div className="mt-1 flex items-center gap-1 text-sm font-bold text-bl-red"><Ic d={ICONS.yen} size={15} />{j.salaryMain}</div>}
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-bl-gray"><Ic d={ICONS.pin} size={14} />{j.location}{j.city ? ` ${j.city}` : ""}</div>
                      </Link>
                      <button onClick={() => unsave(j.id)} disabled={busy === j.id} className="flex-none rounded-full p-1.5 text-bl-red hover:bg-bl-redsoft disabled:opacity-50" title="お気に入りから削除">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21S3 14.5 3 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9 2.8C21 14.5 12 21 12 21z" /></svg>
                      </button>
                    </div>
                    <button onClick={() => apply(j.id)} disabled={busy === j.id} className="mt-3 rounded-xl bg-bl-red py-2.5 text-sm font-bold text-white hover:bg-bl-redd disabled:opacity-60">
                      {busy === j.id ? "処理中…" : "応募する"}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* メッセージ — chat thật (lưu DB) */}
          {sec === "messages" && <CandidateMessages onClose={() => go("apps")} />}

          {/* アカウント設定 */}
          {sec === "settings" && (
            <div className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
              <h3 className="text-base font-black">アカウント設定</h3>
              <dl className="mt-3 divide-y divide-bl-line text-sm">
                <div className="flex justify-between py-2.5"><dt className="text-bl-gray">お名前</dt><dd className="font-semibold">{name}</dd></div>
              </dl>
              <button onClick={logout} className="mt-4 flex items-center gap-2 rounded-xl border border-bl-line px-4 py-2.5 text-sm font-bold text-bl-red hover:bg-bl-redsoft"><Ic d={ICONS.logout} />ログアウト</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
