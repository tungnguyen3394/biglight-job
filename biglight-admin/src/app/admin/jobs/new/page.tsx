import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, canSeeInternalMemo } from "@/lib/permissions";
import { JobForm } from "@/components/jobs/JobForm";
import { makeDefaultForm } from "@/lib/jobFormModel";

export const dynamic = "force-dynamic";

export default async function NewJobPage({ searchParams }: { searchParams: { company?: string } }) {
  const user = (await getSessionUser())!;
  if (!can(user.role, "create", "job")) redirect("/admin/jobs");

  const companies = await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const preselect = searchParams.company && companies.some((c) => c.id === searchParams.company)
    ? searchParams.company
    : companies[0]?.id ?? "";

  return (
    <JobForm
      mode="create"
      companies={companies}
      canInternal={canSeeInternalMemo(user.role)}
      initialForm={makeDefaultForm(preselect)}
    />
  );
}
