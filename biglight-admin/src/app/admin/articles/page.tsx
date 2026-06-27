import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBiglight } from "@/lib/api";
import { effectiveAdminLevel, adminCan } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const STATUS = { DRAFT: { jp: "下書き", tone: "amber" }, PUBLISHED: { jp: "公開", tone: "green" }, SCHEDULED: { jp: "予約", tone: "blue" } } as const;

export default async function Page() {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return <Forbidden />;
  const level = effectiveAdminLevel(user);
  const canWrite = adminCan(level, "articles.create");

  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });

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

      {articles.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">まだ記事がありません。「記事を作成」から SEO 記事を作成できます。</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="p-3">タイトル</th>
                <th className="p-3">カテゴリ</th>
                <th className="p-3">キーワード</th>
                <th className="p-3">SEO</th>
                <th className="p-3">ステータス</th>
                <th className="p-3">更新日</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((ar) => {
                const st = STATUS[ar.status as keyof typeof STATUS] ?? STATUS.DRAFT;
                const tone = ar.seoScore >= 80 ? "text-emerald-600" : ar.seoScore >= 50 ? "text-amber-600" : "text-red-600";
                return (
                  <tr key={ar.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3"><Link href={`/admin/articles/${ar.id}`} className="font-semibold text-navy hover:underline">{ar.title}</Link>{ar.slug && <div className="text-xs text-slate-400">/{ar.slug}</div>}</td>
                    <td className="p-3 text-slate-600">{ar.category ?? "—"}</td>
                    <td className="p-3 text-slate-600">{ar.focusKeyword ?? "—"}</td>
                    <td className={`p-3 font-bold ${tone}`}>{ar.seoScore}</td>
                    <td className="p-3"><Badge tone={st.tone as never}>{st.jp}</Badge></td>
                    <td className="p-3 whitespace-nowrap text-xs text-slate-400">{new Date(ar.updatedAt).toLocaleDateString("ja-JP")}</td>
                    <td className="p-3"><Link href={`/admin/articles/${ar.id}`} className="text-xs font-semibold text-brand-blue hover:underline">{canWrite ? "編集" : "表示"}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
