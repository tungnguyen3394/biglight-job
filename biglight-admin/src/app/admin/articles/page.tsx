import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBiglight } from "@/lib/api";
import { effectiveAdminLevel, adminCan } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import { ArticlesTable, type ArticleRow } from "@/components/admin/ArticlesTable";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return <Forbidden />;
  const level = effectiveAdminLevel(user);
  const canWrite = adminCan(level, "articles.create");

  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
  const rows: ArticleRow[] = articles.map((a) => ({
    id: a.id, title: a.title, slug: a.slug, status: a.status, category: a.category,
    author: a.author, focusKeyword: a.focusKeyword, seoScore: a.seoScore,
    publishAt: a.publishAt ? a.publishAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-ink">記事管理</h1>
          <p className="text-sm text-slate-500">SEO最適化されたコンテンツ（CMS）</p>
        </div>
        {canWrite && (
          <Link href="/admin/articles/new" className="btn btn-navy gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            記事を作成
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">まだ記事がありません。「記事を作成」から SEO 記事を作成できます。</div>
      ) : (
        <ArticlesTable rows={rows} canWrite={canWrite} />
      )}
    </div>
  );
}
