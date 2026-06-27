import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicJob } from "@/lib/publicJob";

export const dynamic = "force-dynamic";

// GET /api/jobs/public — danh sách求人 công khai (chỉ 公開 + 募集中)
export async function GET() {
  const jobs = await prisma.job.findMany({ where: { publicStatus: "PUBLIC", status: "OPEN" }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ jobs: jobs.map(publicJob) });
}
