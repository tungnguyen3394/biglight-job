import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { prisma } from "@/lib/prisma";
import { Forbidden } from "@/components/admin/Forbidden";
import MailSettings from "@/components/admin/MailSettings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || !effectiveAdminLevel(user)) return <Forbidden />;
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { gasUrl: true, canSendMail: true } });
  return <MailSettings initialUrl={u?.gasUrl ?? ""} canSendMail={!!u?.canSendMail} />;
}
