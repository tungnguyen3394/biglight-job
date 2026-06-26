import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Forbidden } from "@/components/admin/Forbidden";
import { CompanyNewForm } from "@/components/admin/CompanyNewForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || !can(user.role, "create", "company")) return <Forbidden />;
  return (
    <div>
      <Link href="/admin" className="mb-3 inline-block text-sm font-semibold text-slate-500 hover:text-navy">← ダッシュボード</Link>
      <h1 className="mb-4 text-[22px] font-black text-ink">企業追加</h1>
      <CompanyNewForm />
    </div>
  );
}
