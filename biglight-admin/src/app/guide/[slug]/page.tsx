import { notFound } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/candidate/Shell";
import SiteFooter from "@/components/candidate/SiteFooter";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { articleCard, articleBodyHtml, type GuideCard } from "@/lib/guide";

export const dynamic = "force-dynamic";

function getArticle(slug: string) {
  return prisma.article.findFirst({ where: { status: "PUBLISHED", OR: [{ slug }, { id: slug }] } });
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const a = await getArticle(params.slug);
  if (!a) return { title: "記事が見つかりません｜BIGLIGHT JOB" };
  const d = (a.data as Record<string, unknown>) || {};
  const desc = (typeof d.metaDescription === "string" && d.metaDescription) || (typeof d.excerpt === "string" && d.excerpt) || "";
  return { title: `${a.title}｜特定技能ガイド｜BIGLIGHT JOB`, description: String(desc).slice(0, 160) };
}

function RelatedCard({ a }: { a: GuideCard }) {
  return (
    <Link href={`/guide/${a.slug}`} className="flex gap-3 rounded-xl border border-bl-line bg-white p-2.5 shadow-sm transition hover:border-bl-red">
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-bl-bg">
        {a.image && <img src={a.image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        {a.category && <span className="text-[10px] font-bold text-bl-red">{a.category}</span>}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">{a.title}</h3>
        <div className="mt-0.5 text-[10px] text-bl-gray2">{a.date.slice(0, 10).replace(/-/g, "/")}</div>
      </div>
    </Link>
  );
}

export default async function GuideArticlePage({ params }: { params: { slug: string } }) {
  const loggedIn = !!(await getSessionUser());
  const a = await getArticle(params.slug);
  if (!a) notFound();

  const d = (a.data as Record<string, unknown>) || {};
  const image = (typeof d.featuredImage === "string" && d.featuredImage) || (typeof d.ogImage === "string" && d.ogImage) || "";
  const html = articleBodyHtml(a.data);
  const date = (a.publishAt ?? a.createdAt).toISOString().slice(0, 10).replace(/-/g, "/");

  const related = a.category
    ? await prisma.article.findMany({
        where: { status: "PUBLISHED", category: a.category, id: { not: a.id } },
        orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
        take: 4,
        select: { id: true, title: true, slug: true, category: true, publishAt: true, createdAt: true, data: true },
      })
    : [];
  const relatedCards = related.map(articleCard);

  return (
    <Shell active="guide" loggedIn={loggedIn}>
      <article className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/guide" className="inline-flex items-center gap-1 text-sm font-semibold text-bl-gray hover:text-bl-red">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          特定技能ガイド
        </Link>
        <div className="mt-3 flex items-center gap-2">
          {a.category && <span className="rounded-full bg-bl-redsoft px-2.5 py-0.5 text-xs font-bold text-bl-red">{a.category}</span>}
          <span className="text-xs text-bl-gray2">{date}</span>
        </div>
        <h1 className="mt-2 text-2xl font-black leading-tight text-ink sm:text-3xl">{a.title}</h1>
        {image && <img src={image} alt="" className="mt-4 w-full rounded-2xl object-cover" />}
        <div className="bl-guide mt-5" dangerouslySetInnerHTML={{ __html: html }} />
      </article>

      {relatedCards.length > 0 && (
        <section className="border-t border-bl-line bg-white">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <h2 className="mb-4 text-lg font-black text-ink">関連記事</h2>
            <div className="grid gap-3 sm:grid-cols-2">{relatedCards.map((c) => <RelatedCard key={c.id} a={c} />)}</div>
          </div>
        </section>
      )}

      <SiteFooter />
      <MessengerPopupButton />

      <style dangerouslySetInnerHTML={{ __html: `
        .bl-guide{line-height:1.9;color:#16181d;font-size:15px}
        .bl-guide h2{font-size:20px;font-weight:800;margin:28px 0 10px;border-left:4px solid #D02E26;padding-left:10px}
        .bl-guide h3{font-size:17px;font-weight:700;margin:20px 0 8px}
        .bl-guide p{margin:10px 0}
        .bl-guide ul,.bl-guide ol{margin:10px 0 10px 22px}
        .bl-guide ul{list-style:disc}.bl-guide ol{list-style:decimal}
        .bl-guide li{margin:4px 0}
        .bl-guide img{max-width:100%;border-radius:12px;margin:14px 0}
        .bl-guide a{color:#D02E26;text-decoration:underline}
        .bl-guide blockquote{border-left:3px solid #D02E26;padding:4px 12px;margin:14px 0;color:#4b5563;background:#FFF6F2;border-radius:0 8px 8px 0}
        .bl-guide table{width:100%;border-collapse:collapse;margin:14px 0;font-size:14px}
        .bl-guide td,.bl-guide th{border:1px solid #e5e7eb;padding:8px}
        .bl-guide .callout{background:#FFF6F2;border:1px solid #FFD9CC;border-radius:12px;padding:12px 14px;margin:14px 0}
      ` }} />
    </Shell>
  );
}
