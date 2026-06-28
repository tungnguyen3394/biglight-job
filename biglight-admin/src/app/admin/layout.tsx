import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "管理画面｜BIGLIGHT JOB", template: "%s｜BIGLIGHT JOB 管理画面" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const level = effectiveAdminLevel(user);

  return (
    <AdminShell name={user.name} role={user.role} level={level}>
      {children}
    </AdminShell>
  );
}
