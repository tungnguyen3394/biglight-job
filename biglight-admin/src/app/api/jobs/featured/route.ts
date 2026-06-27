import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicJob } from "@/lib/publicJob";

export const dynamic = "force-dynamic";

// GET /api/jobs/featured — おすすめ/推奨 (fallback: 最新)
export async function GET() {
  const base = { publicStatus: "PUBLIC" as const, status: "OPEN" as const };
  let jobs = await prisma.job.findMany({ where: { ...base, OR: [{ isFeatured: true }, { isRecommended: true }] }, orderBy: { updatedAt: "desc" }, take: 8 });
  if (jobs.length === 0) jobs = await prisma.job.findMany({ where: base, orderBy: { createdAt: "desc" }, take: 8 });
  return NextResponse.json({ jobs: jobs.map(publicJob) });
}
