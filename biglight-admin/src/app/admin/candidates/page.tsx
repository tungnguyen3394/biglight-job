import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { effectiveAdminLevel, adminCan } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import { CandidatesTable, type CandidateRow } from "@/components/admin/CandidatesTable";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || user.role === "CANDIDATE" || !can(user.role, "view", "candidate")) return <Forbidden />;

  const candidates = await prisma.candidate.findMany({
    include: { user: true, _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  const sStr = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
  const sArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const ymd = (d?: Date | null): string | null => (d ? new Date(d).toISOString().slice(0, 10) : null);
  const now = Date.now();

  const rows: CandidateRow[] = candidates.map((c) => {
    const prefs = (c.prefs as Record<string, unknown>) || {};
    const hasSNS = !!(c.facebookUrl || prefs.instagramUrl || prefs.tiktokUrl);
    const lastActive = [c.user?.lastLoginAt, c.updatedAt, c.createdAt]
      .filter(Boolean)
      .map((d) => new Date(d as Date).getTime())
      .reduce((a, b) => Math.max(a, b), 0);
    // Online ≈ đăng nhập trong 5 phút gần nhất (không có heartbeat realtime).
    const online = c.user?.lastLoginAt ? now - new Date(c.user.lastLoginAt).getTime() < 5 * 60 * 1000 : false;
    const reasons = sArr(prefs.reasons).join("、") || (c.changeReason ?? null);
    return {
      id: c.id,
      name: c.name,
      kana: c.kana,
      image: c.user?.image ?? null,
      nationality: c.nationality,
      phone: c.phone,
      email: c.email ?? c.user?.email ?? null,
      visaType: c.visaType,
      japaneseLevel: c.japaneseLevel,
      address: c.currentAddress,
      createdAt: c.createdAt.toISOString(),
      lastActive: new Date(lastActive).toISOString(),
      hasSNS,
      status: c.status,
      apps: c._count.applications,
      online,
      gender: c.gender === "MALE" ? "男性" : c.gender === "FEMALE" ? "女性" : null,
      birthdate: ymd(c.birthdate),
      facebookUrl: c.facebookUrl,
      instagramUrl: sStr(prefs.instagramUrl),
      tiktokUrl: sStr(prefs.tiktokUrl),
      sswField: c.currentTokuteiField,
      sswCategory: sStr(prefs.sswCategory),
      sswTask: sStr(prefs.sswTask),
      otherSkills: sStr(prefs.otherSkills),
      desiredIndustry: c.desiredIndustry,
      desiredLocation: c.desiredLocation,
      desiredSalary: c.desiredSalary,
      desiredJobType: sStr(prefs.desiredJobType),
      dorm: sStr(prefs.dorm),
      nightShiftWish: sStr(prefs.nightshift),
      shiftWorkWish: sStr(prefs.shiftwork),
      startWork: sStr(prefs.start),
      arrival: sStr(prefs.arrival),
      reasons,
      priorities: sArr(prefs.priorities).join("、") || null,
      changeJobFrom: ymd(c.canChangeJobFrom),
    };
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-navy">応募者管理</h1>
          <p className="text-sm text-slate-500">候補者の検索・絞り込み・詳細確認</p>
        </div>
      </div>
      <CandidatesTable rows={rows} canRowDelete={adminCan(effectiveAdminLevel(user), "applicants.delete")} canBulkDelete={effectiveAdminLevel(user) === "ADMIN"} />
    </div>
  );
}
