import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

// GET — danh sách応募 cho Split View (trái) + danh sách 担当者 (BIGLIGHT users).
export async function GET() {
  const g = await guard("applicants.read");
  if (!g.ok) return g.res;

  const [apps, staff] = await Promise.all([
    prisma.application.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        candidate: { select: { id: true, name: true, kana: true, nationality: true, user: { select: { image: true } } } },
        job: { select: { title: true, code: true } },
        company: { select: { name: true } },
        biglightStaff: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "MANAGER", "BIGLIGHT_STAFF"] }, status: "ACTIVE" },
      select: { id: true, name: true, image: true }, orderBy: { name: "asc" },
    }),
  ]);

  const items = apps.map((a) => ({
    id: a.id,
    candidateId: a.candidateId,
    name: a.candidate.name,
    kana: a.candidate.kana,
    nationality: a.candidate.nationality,
    image: a.candidate.user?.image ?? null,
    jobTitle: a.job.title,
    jobCode: a.job.code,
    company: a.company.name,
    status: a.status,
    staffId: a.biglightStaffId,
    staffName: a.biglightStaff?.name ?? null,
    staffImage: a.biglightStaff?.image ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));
  return NextResponse.json({ items, staff });
}
