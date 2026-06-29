import { prisma } from "@/lib/prisma";
import { industryImage, salaryRange } from "@/lib/site";
import { getSessionUser } from "@/lib/auth";
import { articleCard } from "@/lib/guide";
import { buildMetadata } from "@/lib/seo";
import CandidateHome, { type PublicJob } from "@/components/candidate/CandidateHome";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "特定技能の求人を探す｜寮あり・ビザ支援｜BIGLIGHT JOB",
  description: "特定技能（製造・建設・介護ほか全16分野）の求人を、地域・分野・タグでかんたん検索。寮あり・未経験OK・ビザサポートつき。外国人材のお仕事探しをBIGLIGHTが無料で応援します。",
  path: "/",
});

export default async function Home({ searchParams }: { searchParams: { q?: string } }) {
  const jobs = await prisma.job.findMany({
    where: { publicStatus: "PUBLIC", status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });

  type J = (typeof jobs)[number];
  const toPublic = (j: J): PublicJob => ({
    id: j.id,
    title: j.title,
    industry: j.industry,
    jobType: j.jobTypeName,
    location: j.location,
    city: j.city,
    // 基本給（時給/日給/月給）— không hiển thị tên công ty
    salaryMain:
      j.payType && j.baseSalary
        ? `${j.payType} ¥${j.baseSalary.toLocaleString("ja-JP")}`
        : salaryRange(j.salaryMin, j.salaryMax),
    monthlyExample: j.expectedMonthly ? `月収例 ${Math.round(j.expectedMonthly / 10000)}万円` : null,
    japaneseLevel: j.japaneseLevel,
    residence: j.residenceType,
    dormitory: j.dormitoryAvailable,
    nightShift: j.nightShift,
    recruitCount: j.recruitCount,
    tags: j.tags,
    img: j.imageUrl || industryImage(j.industry),
  });

  const data: PublicJob[] = jobs.map(toPublic);

  // 特定技能ガイド — vài bài mới nhất để teaser ở trang chủ
  const guideRows = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
    take: 4,
    select: { id: true, title: true, slug: true, category: true, publishAt: true, createdAt: true, data: true },
  });
  const guides = guideRows.map(articleCard);

  const session = await getSessionUser();
  let savedIds: string[] = [];
  if (session?.role === "CANDIDATE") {
    const cand = await prisma.candidate.findUnique({ where: { userId: session.id }, select: { savedJobIds: true } });
    savedIds = cand?.savedJobIds ?? [];
  }
  return <CandidateHome jobs={data} guides={guides} initialQ={searchParams.q ?? ""} loggedIn={session?.role === "CANDIDATE"} savedIds={savedIds} />;
}
