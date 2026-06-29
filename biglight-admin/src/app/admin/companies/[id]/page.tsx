import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { effectiveAdminLevel, adminCan, uiCan } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import { CompanyDetail } from "@/components/admin/CompanyDetail";

export const dynamic = "force-dynamic";

const ymd = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null);

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role === "CANDIDATE" || !can(user.role, "view", "company")) return <Forbidden />;
  const level = effectiveAdminLevel(user);
  if (level && !adminCan(level, "companies.read")) return <Forbidden />;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      jobs: { select: { id: true, code: true, title: true, status: true, publicStatus: true }, orderBy: { updatedAt: "desc" } },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          candidate: { select: { id: true, name: true, kana: true } },
          job: { select: { code: true, title: true } },
        },
      },
    },
  });
  if (!company) notFound();

  const canEdit = uiCan(user, "update", "company", "companies.update");

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/companies" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          企業管理へ戻る
        </Link>
        <h1 className="mt-1 text-[22px] font-black text-ink">{company.name}</h1>
      </div>

      <CompanyDetail
        canEdit={canEdit}
        company={{
          id: company.id,
          name: company.name,
          industry: company.industry,
          address: company.address,
          contactName: company.contactName,
          phone: company.phone,
          email: company.email,
          paymentInfo: company.paymentInfo,
          contractDetail: company.contractDetail,
          contractDate: ymd(company.contractDate),
          notes: company.notes,
        }}
        jobs={company.jobs.map((j) => ({ id: j.id, code: j.code, title: j.title, opStatus: j.status, publicStatus: j.publicStatus }))}
        applicants={company.applications.map((a) => ({
          id: a.id,
          candidateId: a.candidate.id,
          name: a.candidate.name,
          kana: a.candidate.kana,
          jobTitle: a.job.title,
          jobCode: a.job.code,
          status: a.status,
          createdAt: new Date(a.createdAt).toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}
