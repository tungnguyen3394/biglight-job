import Shell from "@/components/candidate/Shell";
import SiteFooter from "@/components/candidate/SiteFooter";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import GuideBrowser from "@/components/candidate/GuideBrowser";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { articleCard } from "@/lib/guide";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  path: "/guide",
  title: "特定技能ガイド｜働く人のための知識ハブ｜BIGLIGHT JOB",
  description: "特定技能・ビザ・求人・面接対策・履歴書・日本語・日本での生活・給料/税金など、外国人材が日本で働くために役立つ情報をまとめた知識ハブです。",
});

export default async function GuidePage() {
  const loggedIn = !!(await getSessionUser());
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, slug: true, category: true, publishAt: true, createdAt: true, data: true },
  });
  const cards = articles.map(articleCard);

  return (
    <Shell active="guide" loggedIn={loggedIn}>
      <GuideBrowser cards={cards} />
      <SiteFooter />
      <MessengerPopupButton />
    </Shell>
  );
}
