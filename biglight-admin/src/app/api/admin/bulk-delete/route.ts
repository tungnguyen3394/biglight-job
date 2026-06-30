import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { reportDelete } from "@/lib/deleteAudit";
import type { Permission } from "@/lib/adminAccess";

export const dynamic = "force-dynamic";

type Entity = "job" | "candidate" | "article" | "application" | "company";
const PERM: Record<Entity, Permission> = {
  job: "jobs.delete", candidate: "applicants.delete", article: "articles.delete", application: "applicants.delete", company: "companies.delete",
};

// POST { entity, ids } — xóa dữ liệu có kiểm soát chặt:
//  · VIEW: không xóa (chặn ở .delete perm)
//  · Xóa ĐƠN LẺ (1 id): STAFF hoặc ADMIN
//  · Xóa HÀNG LOẠT (>1 id): CHỈ ADMIN
//  · Mọi lần xóa: ghi 操作ログ + thông báo tất cả admin
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const entity = String(b.entity || "") as Entity;
  const ids: string[] = Array.isArray(b.ids) ? Array.from(new Set(b.ids.map((x: unknown) => String(x)))) : [];
  if (!PERM[entity]) return NextResponse.json({ error: "対象が不正です。" }, { status: 422 });
  if (!ids.length) return NextResponse.json({ error: "削除対象を選択してください。" }, { status: 422 });

  const g = await guard(PERM[entity]);
  if (!g.ok) return g.res;
  if (ids.length > 1 && g.level !== "ADMIN") {
    return NextResponse.json({ error: "一括削除はAdminのみ可能です。" }, { status: 403 });
  }

  // 企業: còn 求人 thì CHẶN xóa (an toàn dữ liệu) — phải xóa/chuyển đơn trước.
  if (entity === "company") {
    const jobCount = await prisma.job.count({ where: { companyId: { in: ids } } });
    if (jobCount > 0) {
      return NextResponse.json({ error: `この企業にはまだ ${jobCount} 件の求人があります。先に求人を削除または移動してください。` }, { status: 409 });
    }
    const names = (await prisma.company.findMany({ where: { id: { in: ids } }, select: { name: true } })).map((r) => r.name);
    await prisma.$transaction([
      prisma.user.updateMany({ where: { companyId: { in: ids } }, data: { companyId: null } }),
      prisma.candidateCommission.deleteMany({ where: { companyId: { in: ids } } }),
      prisma.application.deleteMany({ where: { companyId: { in: ids } } }),
      prisma.company.deleteMany({ where: { id: { in: ids } } }),
    ]);
    await reportDelete(g.user, entity, names);
    return NextResponse.json({ ok: true, count: ids.length });
  }

  let names: string[] = [];
  if (entity === "article") {
    names = (await prisma.article.findMany({ where: { id: { in: ids } }, select: { title: true } })).map((r) => r.title);
    await prisma.article.deleteMany({ where: { id: { in: ids } } });
  } else if (entity === "application") {
    const rows = await prisma.application.findMany({ where: { id: { in: ids } }, select: { candidate: { select: { name: true } }, job: { select: { title: true } } } });
    names = rows.map((r) => `${r.candidate.name}（${r.job.title}）`);
    await prisma.$transaction([
      prisma.candidateCommission.deleteMany({ where: { applicationId: { in: ids } } }),
      prisma.statusHistory.deleteMany({ where: { applicationId: { in: ids } } }),
      prisma.application.deleteMany({ where: { id: { in: ids } } }),
    ]);
  } else if (entity === "candidate") {
    names = (await prisma.candidate.findMany({ where: { id: { in: ids } }, select: { name: true } })).map((r) => r.name);
    const appIds = (await prisma.application.findMany({ where: { candidateId: { in: ids } }, select: { id: true } })).map((a) => a.id);
    await prisma.$transaction([
      prisma.candidateCommission.deleteMany({ where: { candidateId: { in: ids } } }),
      prisma.statusHistory.deleteMany({ where: { applicationId: { in: appIds } } }),
      prisma.application.deleteMany({ where: { candidateId: { in: ids } } }),
      prisma.candidate.deleteMany({ where: { id: { in: ids } } }),
    ]);
  } else { // job
    names = (await prisma.job.findMany({ where: { id: { in: ids } }, select: { title: true } })).map((r) => r.title);
    const appIds = (await prisma.application.findMany({ where: { jobId: { in: ids } }, select: { id: true } })).map((a) => a.id);
    await prisma.$transaction([
      prisma.candidateCommission.deleteMany({ where: { jobId: { in: ids } } }),
      prisma.jobCommission.deleteMany({ where: { jobId: { in: ids } } }),
      prisma.statusHistory.deleteMany({ where: { applicationId: { in: appIds } } }),
      prisma.application.deleteMany({ where: { jobId: { in: ids } } }),
      prisma.job.deleteMany({ where: { id: { in: ids } } }),
    ]);
  }

  await reportDelete(g.user, entity, names);
  return NextResponse.json({ ok: true, count: ids.length });
}
