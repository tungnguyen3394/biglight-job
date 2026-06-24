import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSeeCommission } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function Stat({
  label,
  value,
  sub,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "navy" | "green" | "amber" | "red";
}) {
  const toneCls = {
    navy: "text-navy",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  }[tone];
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-black ${toneCls}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const seeCommission = canSeeCommission(user.role);

  // scope helpers
  const jobWhere: Prisma.JobWhereInput =
    user.role === "COMPANY"
      ? { companyId: user.companyId ?? "__none__" }
      : user.role === "CTV"
      ? { ctvId: user.ctvId ?? "__none__" }
      : {};
  const appWhere: Prisma.ApplicationWhereInput =
    user.role === "COMPANY"
      ? { companyId: user.companyId ?? "__none__" }
      : user.role === "CTV"
      ? { ctvId: user.ctvId ?? "__none__" }
      : {};
  const candWhere: Prisma.CandidateWhereInput =
    user.role === "CTV" ? { referralCtvId: user.ctvId ?? "__none__" } : {};

  const [
    totalJobs,
    publicJobs,
    candToday,
    candMonth,
    appByStatus,
    commAgg,
    commPaidAgg,
  ] = await Promise.all([
    prisma.job.count({ where: jobWhere }),
    prisma.job.count({ where: { ...jobWhere, publicStatus: "PUBLIC" } }),
    prisma.candidate.count({ where: { ...candWhere, createdAt: { gte: startOfToday() } } }),
    prisma.candidate.count({ where: { ...candWhere, createdAt: { gte: startOfMonth() } } }),
    prisma.application.groupBy({ by: ["status"], where: appWhere, _count: true }),
    seeCommission
      ? prisma.candidateCommission.aggregate({ _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: 0 } }),
    seeCommission
      ? prisma.candidateCommission.aggregate({ _sum: { amount: true }, where: { paymentStatus: "PAID" } })
      : Promise.resolve({ _sum: { amount: 0 } }),
  ]);

  const statusCount = (s: string) =>
    appByStatus.find((a) => a.status === s)?._count ?? 0;

  const totalComm = commAgg._sum.amount ?? 0;
  const paidComm = commPaidAgg._sum.amount ?? 0;
  const unpaidComm = totalComm - paidComm;
  const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-navy">ダッシュボード</h1>
      <p className="mb-6 text-sm text-slate-500">
        {user.role === "COMPANY"
          ? "自社の求人・応募状況"
          : user.role === "CTV"
          ? "担当案件のサマリー"
          : "全体のサマリー"}
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="求人 合計" value={totalJobs} />
        <Stat label="公開中の求人" value={publicJobs} tone="green" />
        <Stat label="新規応募者（本日）" value={candToday} />
        <Stat label="新規応募者（今月）" value={candMonth} />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold text-slate-600">選考パイプライン</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="相談中" value={statusCount("CONSULTING")} />
        <Stat label="CV送付済み" value={statusCount("CV_SENT")} />
        <Stat label="面接中" value={statusCount("INTERVIEW_SCHEDULED") + statusCount("INTERVIEWED")} tone="amber" />
        <Stat label="内定" value={statusCount("OFFER")} />
        <Stat label="ビザ申請中" value={statusCount("VISA_APPLYING")} />
        <Stat label="入社済み" value={statusCount("JOINED")} tone="green" />
      </div>

      {seeCommission && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-bold text-slate-600">報酬</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Stat label="発生報酬（合計）" value={yen(totalComm)} />
            <Stat label="支払済み報酬" value={yen(paidComm)} tone="green" />
            <Stat label="未払い報酬" value={yen(unpaidComm)} tone="red" />
          </div>
        </>
      )}
    </div>
  );
}
