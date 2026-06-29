import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { effectiveAdminLevel, adminCan, uiCan } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import { CompaniesList, type CompanyRow } from "@/components/admin/CompaniesList";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || user.role === "CANDIDATE" || !can(user.role, "view", "company")) return <Forbidden />;
  // Nhân viên nội bộ: Staff KHÔNG có companies.read → chặn (chỉ Admin & View xem được).
  const level = effectiveAdminLevel(user);
  if (level && !adminCan(level, "companies.read")) return <Forbidden />;

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      jobs: { select: { id: true, code: true, title: true, status: true, publicStatus: true }, orderBy: { updatedAt: "desc" } },
      _count: { select: { applications: true } },
    },
  });

  const rows: CompanyRow[] = companies.map((c) => ({
    id: c.id,
    name: c.name,
    industry: c.industry,
    contactName: c.contactName,
    phone: c.phone,
    email: c.email,
    applicants: c._count.applications,
    total: c.jobs.length,
    open: c.jobs.filter((j) => j.status === "OPEN").length,
    jobs: c.jobs.map((j) => ({ id: j.id, code: j.code, title: j.title, opStatus: j.status, publicStatus: j.publicStatus })),
  }));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-ink">企業管理</h1>
          <p className="text-sm text-slate-500">企業ごとの求人（募集中の案件）を管理</p>
        </div>
        {uiCan(user, "create", "company", "companies.create") && (
          <Link href="/admin/companies/new" className="btn btn-navy gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            企業追加
          </Link>
        )}
      </div>

      <CompaniesList rows={rows} canCreateJob={uiCan(user, "create", "job", "jobs.create")} />
    </div>
  );
}
