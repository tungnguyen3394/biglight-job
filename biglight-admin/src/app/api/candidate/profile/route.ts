import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function toDate(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
// Field KHÔNG gửi (undefined) → giữ giá trị cũ; gửi rỗng → cho phép xóa (null). Tránh mất dữ liệu do submit thiếu key.
const keepStr = (v: unknown, old: string | null) => (v === undefined ? old : typeof v === "string" && v.trim() ? v.trim() : null);

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

  // 職歴・業務経験 (dùng cho CV/PDF) — làm sạch, bỏ block trống.
  const workHistory = Array.isArray(b.workHistory)
    ? b.workHistory
        .map((w: Record<string, unknown>) => ({
          start: String(w?.start ?? "").trim(),
          end: String(w?.end ?? "").trim(),
          company: String(w?.company ?? "").trim(),
          work: String(w?.work ?? "").trim(),
        }))
        .filter((w: { start: string; end: string; company: string; work: string }) => w.start || w.end || w.company || w.work)
    : [];

  // Các trường nguyện vọng chi tiết (giữ đủ form gốc) → cột prefs (Json).
  const prefs = {
    arrival: b.arrival || "",
    sswField: b.sswField || "",
    sswCategory: b.sswCategory || "",
    sswTask: b.sswTask || "",
    addressDetail: b.addressDetail || "",
    workHistory,
    desiredJobType: b.desiredJobType || "",
    lineId: b.lineId || "",
    instagramUrl: b.instagramUrl || "",
    tiktokUrl: b.tiktokUrl || "",
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
      kana: keepStr(b.kana, candidate.kana),
      birthdate: b.birth === undefined ? candidate.birthdate : toDate(b.birth),
      gender: b.gender === undefined ? candidate.gender : (b.gender === "MALE" || b.gender === "FEMALE" ? b.gender : "ANY"),
      nationality: keepStr(b.nat, candidate.nationality),
      phone: keepStr(b.phone, candidate.phone),
      email: typeof b.email === "string" && b.email.trim() ? b.email.trim() : candidate.email,
      currentAddress: keepStr(b.address, candidate.currentAddress),
      facebookUrl: keepStr(b.facebookUrl, candidate.facebookUrl),
      visaType: keepStr(b.visa, candidate.visaType),
      currentTokuteiField: b.sswField === undefined ? candidate.currentTokuteiField : (b.sswField || null),
      visaExpiryDate: b.expiry === undefined ? candidate.visaExpiryDate : toDate(b.expiry),
      japaneseLevel: keepStr(b.jp, candidate.japaneseLevel),
      desiredSalary: typeof b.desiredSalary === "number" ? b.desiredSalary : (b.desiredSalary === undefined ? candidate.desiredSalary : null),
      desiredIndustry: b.fields === undefined ? candidate.desiredIndustry : (fields.length ? fields.join(",") : null),
      desiredLocation: b.areas === undefined ? candidate.desiredLocation : (areas.length ? areas.join(",") : null),
      // bool tiện lọc cho admin (rút từ lựa chọn 3-way)
      wantDormitory: b.dorm === undefined ? candidate.wantDormitory : b.dorm === "寮を希望",
      canNightShift: b.nightshift === undefined ? candidate.canNightShift : b.nightshift === "できる",
      canShiftWork: b.shiftwork === undefined ? candidate.canShiftWork : b.shiftwork === "できる",
      changeReason: [reasons.join("、"), b.reasonOther].filter(Boolean).join(" / ") || null,
      prefs,
    },
  });

  return NextResponse.json({ ok: true });
}
