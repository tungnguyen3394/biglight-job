import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, canSeeCommission } from "@/lib/permissions";
import { jobScopeWhere } from "@/lib/api";
import { JobsManager } from "./JobsManager";
import type { JobRow } from "./types";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = (await getSessionUser())!;
  const seeCommission = canSeeCommission(user.role);

  const jobs = await prisma.job.findMany({
    where: jobScopeWhere(user),
    orderBy: { updatedAt: "desc" },
    include: {
      company: { select: { name: true } },
      biglightStaff: { select: { name: true } },
      jobCommissions: seeCommission ? { select: { amount: true } } : false,
    },
  });

  const rows: JobRow[] = jobs.map((j) => ({
    id: j.id,
    code: j.code,
    title: j.title,
    jobType: j.jobTypeName,
    company: j.company?.name ?? null,
    location: j.location,
    city: j.city,
    recruitCount: j.recruitCount,
    recruitMale: j.recruitMale,
    recruitFemale: j.recruitFemale,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    dormitory: j.dormitoryAvailable,
    nightShift: j.nightShift,
    shiftWork: j.shiftWork,
    publicStatus: j.publicStatus,
    opStatus: j.status,
    industry: j.industry,
    staff: j.biglightStaff?.name ?? null,
    commission: seeCommission && "jobCommissions" in j && Array.isArray(j.jobCommissions)
      ? (j.jobCommissions as { amount: number }[]).reduce((s, c) => s + c.amount, 0) || null
      : null,
    isFeatured: j.isFeatured,
    isRecommended: j.isRecommended,
    updatedAt: j.updatedAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[22px] font-black text-ink">求人管理</h1>
        <p className="text-sm text-slate-500">Job Management</p>
      </div>

      <JobsManager
        rows={rows}
        seeCommission={seeCommission}
        canCreate={can(user.role, "create", "job")}
        canEdit={can(user.role, "update", "job")}
        canDelete={can(user.role, "delete", "job")}
      />
    </div>
  );
}
