import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function getCandidate() {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") return null;
  return prisma.candidate.findUnique({ where: { userId: session.id } });
}

// POST /api/candidate/apply { jobId } — ứng tuyển: tạo đơn + bỏ khỏi お気に入り.
export async function POST(req: Request) {
  const candidate = await getCandidate();
  if (!candidate) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await req.json().catch(() => ({}));
  if (!jobId) return NextResponse.json({ error: "No jobId" }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const exists = await prisma.application.findFirst({ where: { candidateId: candidate.id, jobId } });
  if (!exists) {
    await prisma.application.create({ data: { candidateId: candidate.id, jobId, companyId: job.companyId, status: "NEW" } });
  }
  const saved = (candidate.savedJobIds ?? []).filter((x) => x !== jobId);
  await prisma.candidate.update({ where: { id: candidate.id }, data: { savedJobIds: saved } });

  return NextResponse.json({ ok: true });
}

// DELETE /api/candidate/apply { jobId } — hủy 応募: xóa đơn + đưa lại お気に入り.
export async function DELETE(req: Request) {
  const candidate = await getCandidate();
  if (!candidate) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await req.json().catch(() => ({}));
  if (!jobId) return NextResponse.json({ error: "No jobId" }, { status: 400 });

  await prisma.application.deleteMany({ where: { candidateId: candidate.id, jobId } });
  const cur = candidate.savedJobIds ?? [];
  if (!cur.includes(jobId)) {
    await prisma.candidate.update({ where: { id: candidate.id }, data: { savedJobIds: [...cur, jobId] } });
  }
  return NextResponse.json({ ok: true });
}
