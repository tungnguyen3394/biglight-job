import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { uiCan } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import { CandidateNewForm } from "@/components/admin/CandidateNewForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || user.role === "CANDIDATE" || !uiCan(user, "create", "candidate", "applicants.create")) return <Forbidden />;
  return (
    <div>
      <Link href="/admin/candidates" className="mb-3 inline-block text-sm font-semibold text-slate-500 hover:text-navy">← 応募者一覧</Link>
      <h1 className="mb-4 text-[22px] font-black text-ink">応募者追加</h1>
      <CandidateNewForm />
    </div>
  );
}
