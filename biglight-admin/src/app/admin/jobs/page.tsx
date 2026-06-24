import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, canSeeCommission } from "@/lib/permissions";
import { jobScopeWhere, sanitizeJobs } from "@/lib/api";
import { JobsTable } from "./JobsTable";

export default async function JobsPage() {
  const user = (await getSessionUser())!;
  const seeCommission = canSeeCommission(user.role);

  const jobs = await prisma.job.findMany({
    where: jobScopeWhere(user),
    orderBy: { updatedAt: "desc" },
    include: {
      company: { select: { id: true, name: true } },
      biglightStaff: { select: { id: true, name: true } },
      ctv: { select: { id: true, name: true } },
      jobCommissions: seeCommission,
      _count: { select: { applications: true } },
    },
  });

  const safe = sanitizeJobs(user, jobs as never) as never[];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-navy">求人管理</h1>
          <p className="text-sm text-slate-500">Job Management</p>
        </div>
        {can(user.role, "create", "job") && (
          <Link href="/admin/jobs/new" className="btn btn-navy">
            ＋ 新規求人
          </Link>
        )}
      </div>

      <JobsTable
        jobs={safe}
        role={user.role}
        seeCommission={seeCommission}
        canDelete={can(user.role, "delete", "job")}
        canEdit={can(user.role, "update", "job")}
      />
    </div>
  );
}
