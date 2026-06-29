import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel, permsForLevel } from "@/lib/adminAccess";
import { loadRolePerms } from "@/lib/rolePerms";
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
  await loadRolePerms(); // nạp override quyền Staff/View (server cache) cho cả UI
  const level = effectiveAdminLevel(user);
  const perms = permsForLevel(level); // quyền hiệu lực → truyền xuống Sidebar (client) cho nhất quán

  return (
    <AdminShell name={user.name} role={user.role} level={level} perms={perms}>
      {children}
    </AdminShell>
  );
}
