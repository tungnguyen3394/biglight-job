import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { denyByLevel } from "@/lib/api";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

// POST /api/companies — admin tạo công ty (để có thể đăng 求人).
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.role, "create", "company")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const denied = denyByLevel(session, "companies.create");
  if (denied) return denied;

  const b = await req.json().catch(() => ({}));
  const name = str(b.name);
  if (!name) return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });

  const company = await prisma.company.create({
    data: { name, industry: str(b.industry), address: str(b.address), contactName: str(b.contactName), phone: str(b.phone), email: str(b.email) },
  });
  return NextResponse.json({ id: company.id });
}
