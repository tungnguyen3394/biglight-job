import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { isBiglight } from "@/lib/api";
import { Forbidden } from "@/components/admin/Forbidden";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return <Forbidden />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-ink">記事管理</h1>
          <p className="text-sm text-slate-500">SEO最適化されたコンテンツ（CMS）</p>
        </div>
        <Link href="/admin/articles/new" className="btn btn-navy gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          記事を作成
        </Link>
      </div>
      <div className="card p-10 text-center text-slate-400">
        まだ記事がありません。「記事を作成」から SEO 記事を作成できます。
      </div>
    </div>
  );
}
