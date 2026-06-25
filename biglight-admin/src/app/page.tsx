import { prisma } from "@/lib/prisma";
import { industryImage, salaryRange } from "@/lib/site";
import HomeBoard, { type PublicJob } from "@/components/candidate/HomeBoard";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: { q?: string } }) {
  const jobs = await prisma.job.findMany({
    where: { publicStatus: "PUBLIC", status: "OPEN" },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  const data: PublicJob[] = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company.name,
    industry: j.industry,
    jobType: j.jobTypeName,
    location: j.location,
    city: j.city,
    salaryLabel: salaryRange(j.salaryMin, j.salaryMax) ?? (j.expectedMonthly ? `月収例 ${Math.round(j.expectedMonthly / 10000)}万円` : null),
    japaneseLevel: j.japaneseLevel,
    residence: j.residenceType,
    dormitory: j.dormitoryAvailable,
    recruitCount: j.recruitCount,
    tags: j.tags,
    img: industryImage(j.industry),
  }));

  return <HomeBoard jobs={data} initialQ={searchParams.q ?? ""} />;
}
