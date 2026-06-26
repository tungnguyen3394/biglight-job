import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { JOB_OP_STATUS_LABEL } from "@/lib/constants";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const startOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); };
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "たった今";
  if (s < 3600) return `${Math.floor(s / 60)}分前`;
  if (s < 86400) return `${Math.floor(s / 3600)}時間前`;
  return `${Math.floor(s / 86400)}日前`;
}

// ---- pipeline 6 giai đoạn ----
const PIPELINE: { label: string; statuses: string[]; tone: "amber" | "red" | "green" }[] = [
  { label: "応募", statuses: ["NEW"], tone: "amber" },
  { label: "面談", statuses: ["CONSULTING", "DOC_CHECK", "CV_SENT"], tone: "amber" },
  { label: "面接", statuses: ["INTERVIEW_ARRANGING", "INTERVIEW_SCHEDULED", "INTERVIEWED"], tone: "amber" },
  { label: "内定", statuses: ["OFFER", "CONTRACT"], tone: "red" },
  { label: "ビザ申請中", statuses: ["VISA_APPLYING", "VISA_APPROVED"], tone: "red" },
  { label: "入社", statuses: ["JOIN_SCHEDULED", "JOINED"], tone: "green" },
];
const TONE = {
  red: { dot: "bg-bl-red", soft: "bg-bl-redsoft text-bl-red", bar: "bg-bl-red" },
  amber: { dot: "bg-bl-amber", soft: "bg-bl-ambersoft text-bl-amber", bar: "bg-bl-amber" },
  green: { dot: "bg-bl-green", soft: "bg-bl-greensoft text-bl-green", bar: "bg-bl-green" },
};

function Kpi({ label, value, sub, tone }: { label: string; value: number; sub: string; tone: "red" | "amber" | "green" }) {
  const t = TONE[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
      </div>
      <div className="mt-3 text-[44px] font-black leading-none tracking-tight text-ink">{value.toLocaleString("ja-JP")}</div>
      <div className="mt-2 text-xs text-slate-400">{sub}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const isStaff = user.role === "SUPER_ADMIN" || user.role === "MANAGER" || user.role === "BIGLIGHT_STAFF";

  const jobWhere: Prisma.JobWhereInput = user.role === "COMPANY" ? { companyId: user.companyId ?? "__none__" } : user.role === "CTV" ? { ctvId: user.ctvId ?? "__none__" } : {};
  const appWhere: Prisma.ApplicationWhereInput = user.role === "COMPANY" ? { companyId: user.companyId ?? "__none__" } : user.role === "CTV" ? { ctvId: user.ctvId ?? "__none__" } : {};
  const candWhere: Prisma.CandidateWhereInput = user.role === "CTV" ? { referralCtvId: user.ctvId ?? "__none__" } : {};

  const since14 = new Date(); since14.setHours(0, 0, 0, 0); since14.setDate(since14.getDate() - 13);
  const since6 = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() - 5, 1); })();

  const [
    totalJobs, openJobs, candToday, candMonth, companiesCount,
    appByStatus, jobsByStatus, candTrendRows, joinedRows,
    recentCands, recentJobs, recentCtvs,
  ] = await Promise.all([
    prisma.job.count({ where: jobWhere }),
    prisma.job.count({ where: { ...jobWhere, status: "OPEN" } }),
    prisma.candidate.count({ where: { ...candWhere, createdAt: { gte: startOfToday() } } }),
    prisma.candidate.count({ where: { ...candWhere, createdAt: { gte: startOfMonth() } } }),
    isStaff ? prisma.company.count() : Promise.resolve(0),
    prisma.application.groupBy({ by: ["status"], where: appWhere, _count: true }),
    prisma.job.groupBy({ by: ["status"], where: jobWhere, _count: true }),
    prisma.candidate.findMany({ where: { ...candWhere, createdAt: { gte: since14 } }, select: { createdAt: true } }),
    prisma.application.findMany({ where: { ...appWhere, status: "JOINED", updatedAt: { gte: since6 } }, select: { joinDate: true, updatedAt: true } }),
    prisma.candidate.findMany({ where: candWhere, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, createdAt: true } }),
    prisma.job.findMany({ where: jobWhere, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, code: true, title: true, createdAt: true } }),
    isStaff ? prisma.ctv.findMany({ orderBy: { createdAt: "desc" }, take: 4, select: { id: true, name: true, createdAt: true } }) : Promise.resolve([]),
  ]);

  const cnt = (statuses: string[]) => appByStatus.filter((a) => statuses.includes(a.status)).reduce((s, a) => s + (a._count as number), 0);
  const pipeline = PIPELINE.map((p) => ({ ...p, count: cnt(p.statuses) }));
  const pipelineMax = Math.max(1, ...pipeline.map((p) => p.count));

  // charts
  const trendLabels: string[] = [], trendData: number[] = [];
  for (let i = 0; i < 14; i++) {
    const day = new Date(since14); day.setDate(since14.getDate() + i);
    trendLabels.push(`${day.getMonth() + 1}/${day.getDate()}`);
    trendData.push(candTrendRows.filter((r) => sameDay(r.createdAt, day)).length);
  }
  const opOrder = ["OPEN", "PAUSED", "CLOSED", "FILLED"];
  const jobStatus = { labels: opOrder.map((s) => JOB_OP_STATUS_LABEL[s] ?? s), data: opOrder.map((s) => (jobsByStatus.find((j) => j.status === s)?._count as number) ?? 0) };
  const hireLabels: string[] = [], hireData: number[] = [];
  for (let i = 0; i < 6; i++) {
    const m = new Date(since6.getFullYear(), since6.getMonth() + i, 1);
    hireLabels.push(`${m.getMonth() + 1}月`);
    hireData.push(joinedRows.filter((r) => { const d = r.joinDate ?? r.updatedAt; return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth(); }).length);
  }

  // recent activity (merge)
  type Act = { kind: "candidate" | "job" | "ctv"; title: string; at: Date; href: string };
  const acts: Act[] = [
    ...recentCands.map((c) => ({ kind: "candidate" as const, title: c.name || "（無名の応募者）", at: c.createdAt, href: `/admin/candidates/${c.id}` })),
    ...recentJobs.map((j) => ({ kind: "job" as const, title: `${j.code} ${j.title}`, at: j.createdAt, href: `/admin/jobs/${j.id}` })),
    ...recentCtvs.map((c) => ({ kind: "ctv" as const, title: c.name, at: c.createdAt, href: `/admin/partners` })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);

  const ACT_META = {
    candidate: { label: "新規応募者", tone: "red" as const, icon: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /></> },
    job: { label: "新規求人", tone: "amber" as const, icon: <><path d="M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></> },
    ctv: { label: "新規CTV", tone: "green" as const, icon: <><circle cx="12" cy="8" r="3.2" /><path d="M5 21c0-4 3-6 7-6s7 2 7 6" /></> },
  };

  const canJob = can(user.role, "create", "job");
  const canCand = can(user.role, "create", "candidate");
  const canCompany = can(user.role, "create", "company");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[30px] font-black tracking-tight text-ink">ダッシュボード</h1>
        <p className="mt-1 text-sm text-slate-500">{isStaff ? "全体のサマリー" : user.role === "COMPANY" ? "自社の求人・応募状況" : "担当案件のサマリー"}</p>
      </div>

      {/* SECTION 1 — Business Overview */}
      <section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="求人 合計" value={totalJobs} sub="登録されている全求人" tone="red" />
          <Kpi label="募集中の求人" value={openJobs} sub="現在オープン中" tone="green" />
          <Kpi label="新規応募者（本日）" value={candToday} sub="本日登録" tone="amber" />
          <Kpi label="応募者（今月）" value={candMonth} sub="今月の新規登録" tone="red" />
        </div>
      </section>

      {/* SECTION 2 — Pipeline */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-ink">選考パイプライン</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {pipeline.map((p, i) => {
              const t = TONE[p.tone];
              return (
                <div key={p.label} className="relative">
                  {i < pipeline.length - 1 && <div className="absolute right-[-4px] top-3 hidden h-px w-2 bg-slate-200 lg:block" />}
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${t.soft}`}>{i + 1}</span>
                    <span className="text-xs font-semibold text-slate-600">{p.label}</span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-ink">{p.count}</div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${Math.round((p.count / pipelineMax) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3 + 5 — Recent Activity + Quick Actions */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-ink">最近のアクティビティ</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            {acts.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">アクティビティはまだありません</div>
            ) : (
              <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-100">
                {acts.map((a, i) => {
                  const m = ACT_META[a.kind];
                  return (
                    <li key={i} className="relative flex items-start gap-3">
                      <span className={`relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full ${TONE[m.tone].soft}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{m.icon}</svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-400">{m.label}</span>
                          <span className="flex-none text-xs text-slate-400">{timeAgo(a.at)}</span>
                        </div>
                        <Link href={a.href} className="block truncate text-sm font-medium text-ink hover:text-bl-red">{a.title}</Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* SECTION 5 — Quick Actions */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-ink">クイック操作</h2>
          <div className="space-y-3">
            {canJob && (
              companiesCount > 0 ? (
                <QuickAction href="/admin/jobs/new" title="求人作成" desc="企業を選んで求人を登録" tone="red" />
              ) : (
                <QuickActionDisabled title="求人作成" desc="先に企業を追加してください" tone="red" />
              )
            )}
            {canCand && <QuickAction href="/admin/candidates/new" title="応募者追加" desc="新しい応募者を登録" tone="amber" />}
            {canCompany && <QuickAction href="/admin/companies/new" title="企業追加" desc="求人を出す企業を登録" tone="green" />}
          </div>
        </div>
      </section>

      {/* SECTION 6 — Charts */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-ink">分析</h2>
        <DashboardCharts trend={{ labels: trendLabels, data: trendData }} jobStatus={jobStatus} hiring={{ labels: hireLabels, data: hireData }} />
      </section>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function QuickAction({ href, title, desc, tone }: { href: string; title: string; desc: string; tone: "red" | "amber" | "green" }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-bl-red hover:shadow-md">
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${TONE[tone].soft}`}><PlusIcon /></span>
      <div className="min-w-0"><div className="text-sm font-bold text-ink">{title}</div><div className="truncate text-xs text-slate-400">{desc}</div></div>
    </Link>
  );
}
function QuickActionDisabled({ title, desc, tone }: { title: string; desc: string; tone: "red" | "amber" | "green" }) {
  return (
    <Link href="/admin/companies/new" className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${TONE[tone].soft} opacity-50`}><PlusIcon /></span>
      <div className="min-w-0"><div className="text-sm font-bold text-slate-400">{title}</div><div className="truncate text-xs text-bl-red">{desc}</div></div>
    </Link>
  );
}
