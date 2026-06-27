import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobScopeWhere, isBiglight } from "@/lib/api";
import { canSeeInternalMemo } from "@/lib/permissions";
import { uiCan } from "@/lib/adminAccess";
import { getAllOptions } from "@/lib/options";
import { JobForm } from "@/components/jobs/JobForm";
import { jobToForm } from "@/lib/jobFormModel";

export const dynamic = "force-dynamic";

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const user = (await getSessionUser())!;

  const job = await prisma.job.findFirst({ where: { AND: [{ id: params.id }, jobScopeWhere(user)] } });
  if (!job) notFound();

  const companies = isBiglight(user.role)
    ? await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : await prisma.company.findMany({ where: { id: job.companyId }, select: { id: true, name: true } });

  const canInternal = canSeeInternalMemo(user.role);
  const initialForm = jobToForm(job as unknown as Record<string, unknown>);
  if (!canInternal) { initialForm.internalMemo = ""; initialForm.companyHistory = ""; initialForm.riskNotes = ""; }
  const opts = await getAllOptions();

  return (
    <div>
      <JobForm
        mode="edit"
        jobId={job.id}
        companies={companies}
        canInternal={canInternal}
        initialForm={initialForm}
        code={job.code}
        options={{ industry: opts.industry, tags: opts.tags }}
      />
      {!uiCan(user, "update", "job", "jobs.update") && (
        <p className="mt-3 text-xs text-slate-400">※ 閲覧のみ（編集権限がありません）。保存はできません。</p>
      )}
    </div>
  );
}
