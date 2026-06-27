import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JOB_OP_STATUS_LABEL } from "@/lib/constants";
import { bucket, PIPE_LABEL, PIPE_TONE, PIPELINE_STATUSES, type PipeStatus } from "@/lib/pipeline";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const startOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); };
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "たった今"; if (s < 3600) return `${Math.floor(s / 60)}分前`;
  if (s < 86400) return `${Math.floor(s / 3600)}時間前`; return `${Math.floor(s / 86400)}日前`;
}
const ENDED = ["REJECTED", "DECLINED", "CANCELLED"];

function KpiCard({ href, label, value, sub, accent }: { href: string; label: string; value: number; sub?: string; accent?: boolean }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-bl-red hover:shadow-md">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-[34px] font-black leading-none tracking-tight ${accent ? "text-bl-red" : "text-ink"}`}>{value.toLocaleString("ja-JP")}</div>
      {sub && <div className="mt-1.5 text-xs text-slate-400">{sub}</div>}
    </Link>
  );
}
function Bar({ label, n, total, tone = "bg-bl-red" }: { label: string; n: number; total: number; tone?: string }) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{label}</span><span className="text-slate-400">{n}（{pct}%）</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const isStaff = user.role === "SUPER_ADMIN" || user.role === "MANAGER" || user.role === "BIGLIGHT_STAFF";

  const jobWhere: Prisma.JobWhereInput = user.role === "COMPANY" ? { companyId: user.companyId ?? "__none__" } : user.role === "CTV" ? { ctvId: user.ctvId ?? "__none__" } : {};
  const appWhere: Prisma.ApplicationWhereInput = user.role === "COMPANY" ? { companyId: user.companyId ?? "__none__" } : user.role === "CTV" ? { ctvId: user.ctvId ?? "__none__" } : {};
  const candWhere: Prisma.CandidateWhereInput = user.role === "CTV" ? { referralCtvId: user.ctvId ?? "__none__" } : {};

  const today = startOfToday(); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const visaSoon = new Date(today); visaSoon.setDate(today.getDate() + 60);
  const since14 = new Date(today); since14.setDate(today.getDate() - 13);
  const since6 = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() - 5, 1); })();

  const [
    totalCands, candMonth, candToday, jobsPublic, jobsPrivate, jobsClosed,
    appByStatus, appStaffRows, staffUsers,
    candTrendRows, candTrend6, appTrend6, joinedRows,
    recentCands, recentJobs,
    unreadConv, interviewToday, consultToday, visaExpiring, incompleteCount,
    topNat, topIndustry, topCompanyRows,
  ] = await Promise.all([
    prisma.candidate.count({ where: candWhere }),
    prisma.candidate.count({ where: { ...candWhere, createdAt: { gte: startOfMonth() } } }),
    prisma.candidate.count({ where: { ...candWhere, createdAt: { gte: today } } }),
    prisma.job.count({ where: { ...jobWhere, publicStatus: "PUBLIC" } }),
    prisma.job.count({ where: { ...jobWhere, publicStatus: { in: ["PRIVATE", "DRAFT", "SUSPENDED", "PENDING_APPROVAL"] } } }),
    prisma.job.count({ where: { ...jobWhere, status: "CLOSED" } }),
    prisma.application.groupBy({ by: ["status"], where: appWhere, _count: true }),
    isStaff ? prisma.application.findMany({ where: appWhere, select: { biglightStaffId: true, status: true } }) : Promise.resolve([]),
    isStaff ? prisma.user.findMany({ where: { role: { in: ["SUPER_ADMIN", "MANAGER", "BIGLIGHT_STAFF"] }, status: "ACTIVE" }, select: { id: true, name: true, image: true } }) : Promise.resolve([]),
    prisma.candidate.findMany({ where: { ...candWhere, createdAt: { gte: since14 } }, select: { createdAt: true } }),
    prisma.candidate.findMany({ where: { ...candWhere, createdAt: { gte: since6 } }, select: { createdAt: true } }),
    prisma.application.findMany({ where: { ...appWhere, createdAt: { gte: since6 } }, select: { createdAt: true } }),
    prisma.application.findMany({ where: { ...appWhere, status: "JOINED", updatedAt: { gte: since6 } }, select: { joinDate: true, updatedAt: true } }),
    prisma.candidate.findMany({ where: candWhere, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, createdAt: true } }),
    prisma.job.findMany({ where: jobWhere, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, code: true, title: true, createdAt: true } }),
    isStaff ? prisma.conversation.count({ where: { unreadByAdmin: true } }) : Promise.resolve(0),
    prisma.application.findMany({ where: { ...appWhere, interviewDate: { gte: today, lt: tomorrow } }, include: { candidate: { select: { name: true } }, job: { select: { title: true } } }, take: 8 }),
    prisma.application.findMany({ where: { ...appWhere, nextActionDate: { gte: today, lt: tomorrow } }, include: { candidate: { select: { name: true } }, job: { select: { title: true } } }, take: 8 }),
    prisma.candidate.findMany({ where: { ...candWhere, visaExpiryDate: { gte: today, lte: visaSoon } }, orderBy: { visaExpiryDate: "asc" }, take: 8, select: { id: true, name: true, visaExpiryDate: true } }),
    prisma.candidate.count({ where: { ...candWhere, OR: [{ nationality: null }, { visaType: null }] } }),
    prisma.candidate.groupBy({ by: ["nationality"], where: candWhere, _count: true }),
    prisma.job.groupBy({ by: ["industry"], where: jobWhere, _count: true }),
    prisma.job.groupBy({ by: ["companyId"], where: jobWhere, _count: true }),
  ]);

  // pipeline buckets
  const bk: Record<PipeStatus, number> = { NEW: 0, CONSULTING: 0, INTERVIEW_SCHEDULED: 0, OFFER: 0, VISA_APPLYING: 0, JOINED: 0, REJECTED: 0, DECLINED: 0 };
  for (const a of appByStatus) bk[bucket(a.status)] += a._count as number;
  const totalApps = Object.values(bk).reduce((s, n) => s + n, 0);
  const activeApps = totalApps - bk.REJECTED - bk.DECLINED - bk.JOINED;

  // funnel cumulative
  const reachConsult = bk.CONSULTING + bk.INTERVIEW_SCHEDULED + bk.OFFER + bk.VISA_APPLYING + bk.JOINED;
  const reachInterview = bk.INTERVIEW_SCHEDULED + bk.OFFER + bk.VISA_APPLYING + bk.JOINED;
  const reachOffer = bk.OFFER + bk.VISA_APPLYING + bk.JOINED;
  const funnel = [
    { label: "応募", n: totalApps }, { label: "面談", n: reachConsult }, { label: "面接", n: reachInterview },
    { label: "内定", n: reachOffer }, { label: "入社", n: bk.JOINED }, { label: "辞退", n: bk.DECLINED }, { label: "不採用", n: bk.REJECTED },
  ];

  // staff KPI
  const sAgg = new Map<string, { active: number; nw: number; offer: number; joined: number; total: number }>();
  for (const r of appStaffRows) {
    if (!r.biglightStaffId) continue;
    const s = sAgg.get(r.biglightStaffId) || { active: 0, nw: 0, offer: 0, joined: 0, total: 0 };
    s.total++; if (r.status === "NEW") s.nw++;
    const b2 = bucket(r.status); if (b2 === "OFFER") s.offer++; if (b2 === "JOINED") s.joined++;
    if (!ENDED.includes(r.status) && r.status !== "JOINED") s.active++;
    sAgg.set(r.biglightStaffId, s);
  }
  const staffKpi = staffUsers.map((u) => { const s = sAgg.get(u.id) || { active: 0, nw: 0, offer: 0, joined: 0, total: 0 }; return { ...u, ...s, rate: s.total ? Math.round((s.joined / s.total) * 100) : 0 }; })
    .filter((s) => s.total > 0).sort((a, b) => b.joined - a.joined || b.rate - a.rate);

  // charts
  const trendLabels: string[] = [], trendData: number[] = [];
  for (let i = 0; i < 14; i++) { const day = new Date(since14); day.setDate(since14.getDate() + i); trendLabels.push(`${day.getMonth() + 1}/${day.getDate()}`); trendData.push(candTrendRows.filter((r) => sameDay(r.createdAt, day)).length); }
  const opOrder = ["OPEN", "PAUSED", "CLOSED", "FILLED"];
  const jobsByStatusGB = await prisma.job.groupBy({ by: ["status"], where: jobWhere, _count: true });
  const jobStatus = { labels: opOrder.map((s) => JOB_OP_STATUS_LABEL[s] ?? s), data: opOrder.map((s) => (jobsByStatusGB.find((j) => j.status === s)?._count as number) ?? 0) };
  const monLabels: string[] = [], joinData: number[] = [], candMonData: number[] = [], appMonData: number[] = [];
  for (let i = 0; i < 6; i++) {
    const m = new Date(since6.getFullYear(), since6.getMonth() + i, 1);
    monLabels.push(`${m.getMonth() + 1}月`);
    const inMonth = (d: Date) => d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    joinData.push(joinedRows.filter((r) => inMonth(r.joinDate ?? r.updatedAt)).length);
    candMonData.push(candTrend6.filter((r) => inMonth(r.createdAt)).length);
    appMonData.push(appTrend6.filter((r) => inMonth(r.createdAt)).length);
  }

  // top-N
  const topN = <T extends { _count: unknown }>(rows: T[]) => [...rows].sort((a, b) => (b._count as number) - (a._count as number)).slice(0, 6);
  const natTop = topN(topNat.filter((r) => r.nationality)).map((r) => ({ label: r.nationality as string, n: r._count as number }));
  const indTop = topN(topIndustry).map((r) => ({ label: r.industry, n: r._count as number }));
  const compIds = topN(topCompanyRows).map((r) => r.companyId);
  const compNames = compIds.length ? await prisma.company.findMany({ where: { id: { in: compIds } }, select: { id: true, name: true } }) : [];
  const compMap = new Map(compNames.map((c) => [c.id, c.name]));
  const compTop = topN(topCompanyRows).map((r) => ({ label: compMap.get(r.companyId) ?? "—", n: r._count as number }));

  const acts = [
    ...recentCands.map((c) => ({ kind: "candidate" as const, title: c.name || "（無名の応募者）", at: c.createdAt, href: `/admin/candidates/${c.id}` })),
    ...recentJobs.map((j) => ({ kind: "job" as const, title: `${j.code} ${j.title}`, at: j.createdAt, href: `/admin/jobs/${j.id}` })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);
  const ACT_META = {
    candidate: { label: "新規応募者", tone: "bg-bl-redsoft text-bl-red", icon: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /></> },
    job: { label: "新規求人", tone: "bg-bl-ambersoft text-bl-amber", icon: <><path d="M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></> },
  };

  return (
    <div className="space-y-9">
      <div>
        <h1 className="text-[28px] font-black tracking-tight text-ink">ダッシュボード</h1>
        <p className="mt-1 text-sm text-slate-500">採用全体のKPIとアクティビティ</p>
      </div>

      {/* 応募者 KPI */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">応募者</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard href="/admin/candidates" label="総登録者数" value={totalCands} sub="全応募者" accent />
          <KpiCard href="/admin/candidates" label="今月の新規登録" value={candMonth} />
          <KpiCard href="/admin/candidates" label="本日の新規登録" value={candToday} />
          <KpiCard href="/admin/pipeline" label="応募中の人数" value={activeApps} sub="選考中（進行中）" />
        </div>
      </section>

      {/* 求人 KPI */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">求人</h2>
        <div className="grid grid-cols-3 gap-4">
          <KpiCard href="/admin/jobs" label="公開中の求人" value={jobsPublic} accent />
          <KpiCard href="/admin/jobs" label="非公開求人" value={jobsPrivate} />
          <KpiCard href="/admin/jobs" label="募集終了" value={jobsClosed} />
        </div>
      </section>

      {/* 選考パイプライン (8段階 + %) */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">選考パイプライン</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {PIPELINE_STATUSES.map((s) => (
            <Link key={s} href="/admin/pipeline" className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-bl-red">
              <span className={`badge ${PIPE_TONE[s]}`}>{PIPE_LABEL[s]}</span>
              <div className="mt-2 text-2xl font-black text-ink">{bk[s]}</div>
              <div className="text-[11px] text-slate-400">{totalApps ? Math.round((bk[s] / totalApps) * 100) : 0}%</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 採用ファネル KPI */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-ink">採用ファネル（応募基準）</h2>
          <div className="space-y-3">{funnel.map((s, i) => <Bar key={s.label} label={s.label} n={s.n} total={totalApps} tone={i >= 5 ? "bg-slate-400" : "bg-bl-red"} />)}</div>
        </div>
        {/* 担当者 KPI */}
        {isStaff && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-ink">担当者KPI（実績順）</h2>
            {staffKpi.length === 0 ? <p className="text-sm text-slate-400">担当データがありません。</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-400"><th className="py-1.5">担当者</th><th className="py-1.5 text-right">担当中</th><th className="py-1.5 text-right">新規</th><th className="py-1.5 text-right">内定</th><th className="py-1.5 text-right">入社</th><th className="py-1.5 text-right">入社率</th></tr></thead>
                  <tbody>
                    {staffKpi.map((s) => (
                      <tr key={s.id} className="border-t border-slate-50">
                        <td className="py-1.5 font-semibold text-ink">{s.name}</td>
                        <td className="py-1.5 text-right">{s.active}</td><td className="py-1.5 text-right">{s.nw}</td><td className="py-1.5 text-right">{s.offer}</td><td className="py-1.5 text-right font-bold text-emerald-600">{s.joined}</td><td className="py-1.5 text-right font-bold">{s.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 今日のタスク */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">今日のタスク</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TaskCard title="本日の面接" count={interviewToday.length} href="/admin/pipeline" items={interviewToday.map((a) => `${a.candidate.name}・${a.job.title}`)} />
          <TaskCard title="本日の面談" count={consultToday.length} href="/admin/pipeline" items={consultToday.map((a) => `${a.candidate.name}・${a.job.title}`)} />
          <TaskCard title="ビザ期限が近い（60日以内）" count={visaExpiring.length} href="/admin/candidates" items={visaExpiring.map((c) => `${c.name}・${c.visaExpiryDate ? c.visaExpiryDate.toISOString().slice(0, 10) : ""}`)} />
          <TaskCard title="プロフィール未完成" count={incompleteCount} href="/admin/candidates" items={[]} note="国籍・在留資格などが未入力" />
          {isStaff && <TaskCard title="未返信のメッセージ" count={unreadConv} href="/admin/messages" items={[]} note="応募者からの新着" />}
        </div>
      </section>

      {/* アクティビティ */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-ink">最近のアクティビティ</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            {acts.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">アクティビティはまだありません</div> : (
              <ol className="space-y-4">
                {acts.map((a, i) => {
                  const m = ACT_META[a.kind];
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${m.tone}`}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{m.icon}</svg></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2"><span className="text-xs font-semibold text-slate-400">{m.label}</span><span className="flex-none text-xs text-slate-400">{timeAgo(a.at)}</span></div>
                        <Link href={a.href} className="block truncate text-sm font-medium text-ink hover:text-bl-red">{a.title}</Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold text-ink">トップ集計</h2>
          <div className="space-y-4">
            <TopList title="国籍 TOP" rows={natTop} />
            <TopList title="業種 TOP" rows={indTop} />
            <TopList title="企業 TOP" rows={compTop} />
          </div>
        </div>
      </section>

      {/* 分析 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">分析</h2>
        <DashboardCharts trend={{ labels: trendLabels, data: trendData }} jobStatus={jobStatus} hiring={{ labels: monLabels, data: joinData }} />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MonthBars title="月別 新規登録者" labels={monLabels} data={candMonData} tone="bg-bl-red" />
          <MonthBars title="月別 応募数" labels={monLabels} data={appMonData} tone="bg-bl-amber" />
        </div>
      </section>
    </div>
  );
}

function TaskCard({ title, count, href, items, note }: { title: string; count: number; href: string; items: string[]; note?: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-bl-red">
      <div className="flex items-center justify-between"><span className="text-sm font-bold text-ink">{title}</span><span className={`rounded-full px-2 py-0.5 text-sm font-black ${count > 0 ? "bg-bl-redsoft text-bl-red" : "bg-slate-100 text-slate-400"}`}>{count}</span></div>
      {note && <div className="mt-1 text-xs text-slate-400">{note}</div>}
      {items.length > 0 && <ul className="mt-2 space-y-1 text-xs text-slate-500">{items.slice(0, 4).map((t, i) => <li key={i} className="truncate">・{t}</li>)}</ul>}
    </Link>
  );
}
function TopList({ title, rows }: { title: string; rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 text-sm font-bold text-ink">{title}</div>
      {rows.length === 0 ? <p className="text-xs text-slate-400">データなし</p> : (
        <div className="space-y-2">{rows.map((r) => (
          <div key={r.label}><div className="mb-0.5 flex justify-between text-xs"><span className="truncate font-medium text-slate-600">{r.label}</span><span className="text-slate-400">{r.n}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-navy" style={{ width: `${Math.round((r.n / max) * 100)}%` }} /></div></div>
        ))}</div>
      )}
    </div>
  );
}
function MonthBars({ title, labels, data, tone }: { title: string; labels: string[]; data: number[]; tone: string }) {
  const max = Math.max(1, ...data);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 text-sm font-bold text-ink">{title}</div>
      <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
        {labels.map((l, i) => (
          <div key={l} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px] font-bold text-slate-500">{data[i]}</span>
            <div className={`w-full rounded-t ${tone}`} style={{ height: `${Math.round((data[i] / max) * 90)}%`, minHeight: 2 }} />
            <span className="text-[10px] text-slate-400">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
