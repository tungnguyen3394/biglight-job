import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicJob } from "@/lib/publicJob";

export const dynamic = "force-dynamic";

// GET /api/jobs/public/[id] — chi tiết求人 công khai
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const job = await prisma.job.findFirst({ where: { id: params.id, publicStatus: "PUBLIC" } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job: publicJob(job) });
}
