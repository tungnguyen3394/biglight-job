import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { denyByLevel } from "@/lib/api";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

// PATCH /api/companies/[id] — admin sửa thông tin công ty.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.role, "update", "company")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const denied = denyByLevel(session, "companies.update");
  if (denied) return denied;

  const b = await req.json().catch(() => ({}));
  const name = str(b.name);
  if (!name) return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });

  const contractDate = str(b.contractDate);
  await prisma.company.update({
    where: { id: params.id },
    data: {
      name, industry: str(b.industry), address: str(b.address), contactName: str(b.contactName), phone: str(b.phone), email: str(b.email),
      paymentInfo: str(b.paymentInfo), contractDetail: str(b.contractDetail), notes: str(b.notes),
      contractDate: contractDate ? new Date(contractDate) : null,
    },
  });
  return NextResponse.json({ ok: true });
}
