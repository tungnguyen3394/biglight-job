import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function toDate(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

// POST /api/candidate/profile — lưu hồ sơ của lao động đang đăng nhập (đủ trường như bản gốc).
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const candidate = await prisma.candidate.findUnique({ where: { userId: session.id } });
  if (!candidate) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const reasons = arr(b.reasons);
  const priorities = arr(b.priorities);
  const fields = arr(b.fields);
  const areas = arr(b.areas);

  // Các trường nguyện vọng chi tiết (giữ đủ form gốc) → cột prefs (Json).
  const prefs = {
    arrival: b.arrival || "",
    sswField: b.sswField || "",
    sswCategory: b.sswCategory || "",
    sswTask: b.sswTask || "",
    otherSkills: b.otherSkills || "",
    desiredJobType: b.desiredJobType || "",
    lineId: b.lineId || "",
    dorm: b.dorm || "",
    start: b.start || "",
    nightshift: b.nightshift || "",
    shiftwork: b.shiftwork || "",
    reasons,
    reasonOther: b.reasonOther || "",
    priorities,
  };

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      name: typeof b.name === "string" && b.name.trim() ? b.name.trim() : candidate.name,
      birthdate: toDate(b.birth),
      gender: b.gender === "MALE" || b.gender === "FEMALE" ? b.gender : "ANY",
      nationality: b.nat || null,
      phone: typeof b.phone === "string" && b.phone.trim() ? b.phone.trim() : null,
      email: typeof b.email === "string" && b.email.trim() ? b.email.trim() : candidate.email,
      currentAddress: b.address || null,
      facebookUrl: b.facebookUrl || null,
      visaType: b.visa || null,
      currentTokuteiField: b.sswField || null,
      visaExpiryDate: toDate(b.expiry),
      japaneseLevel: b.jp || null,
      desiredSalary: typeof b.desiredSalary === "number" ? b.desiredSalary : null,
      desiredIndustry: fields.length ? fields.join(",") : null,
      desiredLocation: areas.length ? areas.join(",") : null,
      // bool tiện lọc cho admin (rút từ lựa chọn 3-way)
      wantDormitory: b.dorm === "寮を希望",
      canNightShift: b.nightshift === "できる",
      canShiftWork: b.shiftwork === "できる",
      changeReason: [reasons.join("、"), b.reasonOther].filter(Boolean).join(" / ") || null,
      prefs,
    },
  });

  return NextResponse.json({ ok: true });
}
