import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import UserDetailCard from "@/components/admin/UserDetailCard";

export const dynamic = "force-dynamic";

// Chi tiết admin/staff — layout kiểu hồ sơ応募者. Sửa được 氏名・写真・権限; các trường khác placeholder (chưa có cột DB).
export default async function Page({ params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me || effectiveAdminLevel(me) !== "ADMIN") return <Forbidden />;

  const u = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true, adminRole: true, image: true },
  });
  if (!u) notFound();

  const perm: "Admin" | "Staff" = u.adminRole === "ADMIN" || u.role === "SUPER_ADMIN" || u.role === "MANAGER" ? "Admin" : "Staff";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-ink">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>ユーザー管理へ戻る
      </Link>
      <UserDetailCard user={{ id: u.id, name: u.name ?? "", email: u.email, image: u.image, perm }} />
    </div>
  );
}
