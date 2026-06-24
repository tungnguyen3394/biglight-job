import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} />
      <div className="md:pl-60">
        <Header name={user.name} role={user.role} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
