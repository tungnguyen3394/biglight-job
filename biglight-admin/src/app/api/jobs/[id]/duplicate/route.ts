import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

// POST /api/jobs/[id]/duplicate — tạo bản sao求人 (DRAFT) từ求人 hiện có.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.role, "create", "job")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // bỏ các trường tự sinh + trạng thái; phần còn lại copy nguyên
  const { id, code, createdAt, updatedAt, hiredCount, publicStatus, status, formData, ...rest } = job;
  void id; void createdAt; void updatedAt; void hiredCount; void publicStatus; void status;

  const created = await prisma.job.create({
    data: {
      ...rest,
      formData: (formData ?? {}) as Prisma.InputJsonValue,
      code: `${code}-COPY-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      title: `${job.title}（コピー）`,
      publicStatus: "DRAFT",
      status: "OPEN",
      hiredCount: 0,
    },
  });

  return NextResponse.json({ id: created.id });
}
