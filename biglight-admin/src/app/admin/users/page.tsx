import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import { UsersManager, type UserRow } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || effectiveAdminLevel(user) !== "ADMIN") return <Forbidden />;

  const users = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "MANAGER", "BIGLIGHT_STAFF"] } },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, adminRole: true, status: true, lastLoginAt: true, image: true, canSendMail: true, gasUrl: true },
  });

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    adminRole: u.adminRole,
    status: u.status,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    image: u.image,
    canSendMail: u.canSendMail,
    gasUrl: u.gasUrl,
  }));

  return <UsersManager initial={rows} meId={user.id} />;
}
