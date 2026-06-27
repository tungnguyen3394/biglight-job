import { prisma } from "@/lib/prisma";
import { industryImage, salaryRange } from "@/lib/site";
import { getSessionUser } from "@/lib/auth";
import CandidateHome, { type PublicJob } from "@/components/candidate/CandidateHome";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "特定技能の求人を探す｜寮あり・ビザ支援｜BIGLIGHT JOB",
  description: "特定技能（製造・建設・介護ほか全16分野）の求人を、地域・分野・タグでかんたん検索。寮あり・未経験OK・ビザサポートつき。外国人材のお仕事探しをBIGLIGHTが無料で応援します。",
};

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
  // おすすめ: isFeatured/isRecommended → fallback 最新
  const picked = jobs.filter((j) => j.isFeatured || j.isRecommended);
  const featured: PublicJob[] = (picked.length ? picked : jobs).slice(0, 8).map(toPublic);

  const session = await getSessionUser();
  let savedIds: string[] = [];
  if (session?.role === "CANDIDATE") {
    const cand = await prisma.candidate.findUnique({ where: { userId: session.id }, select: { savedJobIds: true } });
    savedIds = cand?.savedJobIds ?? [];
  }
  return <CandidateHome jobs={data} featured={featured} initialQ={searchParams.q ?? ""} loggedIn={!!session} savedIds={savedIds} />;
}
