import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

function toDate(s: unknown): Date | null {
  if (!s || typeof s !== "string") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

// PATCH /api/candidates/[id] — admin cập nhật hồ sơ ứng viên (基本/在留/希望/メモ).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.role, "update", "candidate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  // 基本情報
  if ("name" in b) data.name = str(b.name) ?? "";
  if ("kana" in b) data.kana = str(b.kana);
  if ("gender" in b) data.gender = b.gender === "MALE" || b.gender === "FEMALE" ? b.gender : "ANY";
  if ("birthdate" in b) data.birthdate = toDate(b.birthdate);
  if ("nationality" in b) data.nationality = str(b.nationality);
  if ("phone" in b) data.phone = str(b.phone);
  if ("email" in b) data.email = str(b.email);
  // 在留資格
  if ("visaType" in b) data.visaType = str(b.visaType);
  if ("visaExpiryDate" in b) data.visaExpiryDate = toDate(b.visaExpiryDate);
  if ("currentTokuteiField" in b) data.currentTokuteiField = str(b.currentTokuteiField);
  if ("japaneseLevel" in b) data.japaneseLevel = str(b.japaneseLevel);
  // 希望条件
  if ("desiredLocation" in b) data.desiredLocation = str(b.desiredLocation);
  if ("desiredIndustry" in b) data.desiredIndustry = str(b.desiredIndustry);
  if ("desiredSalary" in b) data.desiredSalary = typeof b.desiredSalary === "number" ? b.desiredSalary : null;
  if ("canChangeJobFrom" in b) data.canChangeJobFrom = toDate(b.canChangeJobFrom);
  // メモ (admin only)
  if ("internalMemo" in b) data.internalMemo = typeof b.internalMemo === "string" ? b.internalMemo : null;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });

  await prisma.candidate.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE /api/candidates/[id] — xóa ứng viên + dữ liệu liên quan (chỉ role có quyền delete).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.role, "delete", "candidate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apps = await prisma.application.findMany({ where: { candidateId: params.id }, select: { id: true } });
  const appIds = apps.map((a) => a.id);

  await prisma.$transaction([
    prisma.candidateCommission.deleteMany({ where: { candidateId: params.id } }),
    prisma.statusHistory.deleteMany({ where: { applicationId: { in: appIds } } }),
    prisma.application.deleteMany({ where: { candidateId: params.id } }),
    prisma.candidate.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
