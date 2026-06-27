import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { denyByLevel } from "@/lib/api";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

// POST /api/candidates — admin thêm ứng viên thủ công (CRM lead, không có tài khoản login).
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.role, "create", "candidate")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const denied = denyByLevel(session, "applicants.create");
  if (denied) return denied;

  const b = await req.json().catch(() => ({}));
  const name = str(b.name);
  if (!name) return NextResponse.json({ error: "氏名は必須です" }, { status: 400 });

  const c = await prisma.candidate.create({
    data: {
      name,
      kana: str(b.kana),
      nationality: str(b.nationality),
      gender: b.gender === "MALE" || b.gender === "FEMALE" ? b.gender : "ANY",
      phone: str(b.phone),
      email: str(b.email),
      visaType: str(b.visaType),
      japaneseLevel: str(b.japaneseLevel),
      status: "新規",
    },
  });
  return NextResponse.json({ id: c.id });
}
