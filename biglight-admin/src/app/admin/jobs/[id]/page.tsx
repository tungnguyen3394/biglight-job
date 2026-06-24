import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobScopeWhere, sanitizeJob } from "@/lib/api";
import { can, canSeeInternalMemo, canSeeCommission } from "@/lib/permissions";
import { JobForm } from "@/components/jobs/JobForm";

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const user = (await getSessionUser())!;

  const job = await prisma.job.findFirst({
    where: { AND: [{ id: params.id }, jobScopeWhere(user)] },
  });
  if (!job) notFound();

  const safe = sanitizeJob(user, job as never) as Record<string, unknown>;
  // normalize date fields for <input type=date>
  safe.startDate = toDateInput((job as { startDate: Date | null }).startDate);

  const isBiglight = user.role === "SUPER_ADMIN" || user.role === "BIGLIGHT_STAFF";
  const companies = isBiglight
    ? await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : await prisma.company.findMany({ where: { id: job.companyId }, select: { id: true, name: true } });
  const ctvs = isBiglight
    ? await prisma.ctv.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : [];

  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-navy">{job.title}</h1>
      <p className="mb-4 font-mono text-xs text-slate-400">{job.code}</p>
      <JobForm
        mode="edit"
        jobId={job.id}
        initial={safe}
        companies={companies}
        ctvs={ctvs}
        canInternal={canSeeInternalMemo(user.role)}
        seeCommission={canSeeCommission(user.role)}
      />
      {!can(user.role, "update", "job") && (
        <p className="mt-3 text-xs text-slate-400">※ 閲覧のみ（編集権限がありません）</p>
      )}
    </div>
  );
}
