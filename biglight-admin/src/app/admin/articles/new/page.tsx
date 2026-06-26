import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBiglight } from "@/lib/api";
import { Forbidden } from "@/components/admin/Forbidden";
import { ArticleCMS } from "@/components/admin/articles/ArticleCMS";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return <Forbidden />;

  const jobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    select: { id: true, code: true, title: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return <ArticleCMS jobs={jobs} />;
}
