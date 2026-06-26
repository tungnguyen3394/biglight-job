import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBiglight } from "@/lib/api";
import { Forbidden } from "@/components/admin/Forbidden";
import { ArticleCMS } from "@/components/admin/articles/ArticleCMS";
import { makeDefaultArticle, type ArticleState } from "@/lib/articleModel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return <Forbidden />;

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) notFound();

  const jobs = await prisma.job.findMany({ where: { status: "OPEN" }, select: { id: true, code: true, title: true }, orderBy: { updatedAt: "desc" }, take: 100 });

  const data = (article.data as Partial<ArticleState>) || {};
  const initialData: ArticleState = { ...makeDefaultArticle(), ...data, status: article.status as ArticleState["status"] };

  return <ArticleCMS jobs={jobs} initialId={article.id} initialData={initialData} />;
}
