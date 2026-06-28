import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSeeCommission } from "@/lib/permissions";
import { uiCan } from "@/lib/adminAccess";
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

  const sArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter(Boolean).map(String) : []);
  const sStr = (v: unknown): string => (typeof v === "string" ? v : "");
  const rows: JobRow[] = jobs.map((j) => {
    const fd = (j.formData as Record<string, unknown>) || {};
    return {
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
      isUrgent: j.isUrgent,
      updatedAt: j.updatedAt.toISOString(),
      payType: j.payType,
      baseSalary: j.baseSalary,
      expectedMonthly: j.expectedMonthly,
      expectedTakeHome: j.expectedTakeHome,
      japaneseLevel: j.japaneseLevel,
      employmentType: sStr(fd.term) || j.employmentType || null,
      dormitoryFee: j.dormitoryFee,
      utilitiesCost: j.utilitiesCost,
      wifi: j.wifi,
      workHours: j.workHours,
      overtimeHours: j.overtimeHours,
      holidays: j.holidays,
      bonus: j.bonus,
      commuteMethod: j.commuteMethod,
      requiredQualification: j.requiredQualification,
      tags: j.tags,
      benefits: sArr(fd.benefits),
      startTime: sStr(fd.start) || null,
      houseType: sStr(fd.houseType) || null,
    };
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[22px] font-black text-ink">求人管理</h1>
        <p className="text-sm text-slate-500">Job Management</p>
      </div>

      <JobsManager
        rows={rows}
        seeCommission={seeCommission}
        canCreate={uiCan(user, "create", "job", "jobs.create")}
        canEdit={uiCan(user, "update", "job", "jobs.update")}
        canDelete={uiCan(user, "delete", "job", "jobs.delete")}
      />
    </div>
  );
}
