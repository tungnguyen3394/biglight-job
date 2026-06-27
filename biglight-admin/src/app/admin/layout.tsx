import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const level = effectiveAdminLevel(user);

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} level={level} />
      <div className="md:pl-60">
        <Header name={user.name} role={user.role} level={level} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
