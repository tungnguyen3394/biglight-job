import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
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

  const rows: CandidateRow[] = candidates.map((c) => {
    const prefs = (c.prefs as Record<string, unknown>) || {};
    const hasSNS = !!(c.facebookUrl || prefs.lineId || prefs.instagramUrl || prefs.tiktokUrl);
    const lastActive = [c.user?.lastLoginAt, c.updatedAt, c.createdAt]
      .filter(Boolean)
      .map((d) => new Date(d as Date).getTime())
      .reduce((a, b) => Math.max(a, b), 0);
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
      <CandidatesTable rows={rows} />
    </div>
  );
}
