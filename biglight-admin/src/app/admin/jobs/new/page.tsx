import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, canSeeInternalMemo, canSeeCommission } from "@/lib/permissions";
import { JobForm } from "@/components/jobs/JobForm";

export default async function NewJobPage({ searchParams }: { searchParams: { company?: string } }) {
  const user = (await getSessionUser())!;
  if (!can(user.role, "create", "job")) redirect("/admin/jobs");

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const ctvs = await prisma.ctv.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // preselect công ty khi đến từ 企業管理
  const initial = searchParams.company && companies.some((c) => c.id === searchParams.company)
    ? { companyId: searchParams.company }
    : {};

  return (
    <div>
      <h1 className="mb-4 text-xl font-black text-navy">新規求人の作成</h1>
      <JobForm
        mode="create"
        initial={initial}
        companies={companies}
        ctvs={ctvs}
        canInternal={canSeeInternalMemo(user.role)}
        seeCommission={canSeeCommission(user.role)}
      />
    </div>
  );
}
