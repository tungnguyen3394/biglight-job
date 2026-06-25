import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function toDate(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// POST /api/candidate/profile — lưu hồ sơ của lao động đang đăng nhập.
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const candidate = await prisma.candidate.findUnique({ where: { userId: session.id } });
  if (!candidate) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const b = await req.json().catch(() => ({}));

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      name: typeof b.name === "string" && b.name.trim() ? b.name.trim() : candidate.name,
      birthdate: toDate(b.birthdate),
      gender: b.gender === "MALE" || b.gender === "FEMALE" ? b.gender : "ANY",
      nationality: b.nationality || null,
      visaType: b.visaType || null,
      currentTokuteiField: b.currentTokuteiField || null,
      visaExpiryDate: toDate(b.visaExpiryDate),
      japaneseLevel: b.japaneseLevel || null,
      desiredSalary: typeof b.desiredSalary === "number" ? b.desiredSalary : null,
      desiredIndustry: Array.isArray(b.desiredIndustry) ? b.desiredIndustry.join(",") : b.desiredIndustry || null,
      desiredLocation: Array.isArray(b.desiredLocation) ? b.desiredLocation.join(",") : b.desiredLocation || null,
      wantDormitory: !!b.wantDormitory,
      canNightShift: !!b.canNightShift,
      canShiftWork: !!b.canShiftWork,
      changeReason: b.changeReason || null,
    },
  });

  return NextResponse.json({ ok: true });
}
