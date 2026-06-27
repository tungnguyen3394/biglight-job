import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { AdminShell } from "@/components/admin/AdminShell";

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
