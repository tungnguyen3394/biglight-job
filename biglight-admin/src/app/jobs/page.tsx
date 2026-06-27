import { prisma } from "@/lib/prisma";
import { industryImage, salaryRange } from "@/lib/site";
import { getSessionUser } from "@/lib/auth";
import JobsBrowser, { type BrowseJob } from "@/components/candidate/JobsBrowser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "特定技能の求人一覧｜地域・分野・条件でしぼり込み｜BIGLIGHT JOB",
  description: "特定技能の求人を都道府県・業種・職種・給与・寮・夜勤・日本語レベルでしぼり込み。寮あり・未経験OK・ビザサポートつきの求人を探せます。",
};

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({ where: { publicStatus: "PUBLIC" }, orderBy: { createdAt: "desc" } });

  const items: BrowseJob[] = jobs.map((j) => {
    const salaryValue = j.expectedMonthly ?? (j.payType === "月給" ? j.baseSalary ?? 0 : j.salaryMin ?? 0);
    return {
      id: j.id,
      code: j.code,
      title: j.title,
      industry: j.industry,
      jobType: j.jobTypeName,
      prefecture: j.location,
      city: j.city,
      salaryMain: j.payType && j.baseSalary ? `${j.payType} ¥${j.baseSalary.toLocaleString("ja-JP")}` : salaryRange(j.salaryMin, j.salaryMax),
      salaryValue,
      recruitCount: j.recruitCount,
      dormitory: j.dormitoryAvailable,
      nightShift: j.nightShift,
      japaneseLevel: j.japaneseLevel,
      gender: j.genderCondition,
      residence: j.residenceType,
      isFeatured: j.isFeatured,
      isRecommended: j.isRecommended,
      isUrgent: j.isUrgent,
      open: j.status === "OPEN" && j.recruitCount > j.hiredCount,
      createdAt: j.createdAt.toISOString(),
      tags: j.tags,
      img: j.imageUrl || industryImage(j.industry),
    };
  });

  const session = await getSessionUser();
  let savedIds: string[] = [];
  if (session?.role === "CANDIDATE") {
    const cand = await prisma.candidate.findUnique({ where: { userId: session.id }, select: { savedJobIds: true } });
    savedIds = cand?.savedJobIds ?? [];
  }

  return <JobsBrowser items={items} loggedIn={!!session} savedIds={savedIds} />;
}
