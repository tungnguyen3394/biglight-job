import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// POST /api/candidate/saved { jobId } — bật/tắt lưu việc làm (お気に入り).
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const candidate = await prisma.candidate.findUnique({ where: { userId: session.id } });
  if (!candidate) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const { jobId } = await req.json().catch(() => ({}));
  if (!jobId) return NextResponse.json({ error: "No jobId" }, { status: 400 });

  const cur = candidate.savedJobIds ?? [];
  const next = cur.includes(jobId) ? cur.filter((x) => x !== jobId) : [...cur, jobId];
  await prisma.candidate.update({ where: { id: candidate.id }, data: { savedJobIds: next } });

  return NextResponse.json({ saved: next.includes(jobId), savedJobIds: next });
}
