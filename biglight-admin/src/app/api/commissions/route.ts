import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, forbidden, json, commissionScopeWhere } from "@/lib/api";

// GET /api/commissions — 報酬管理.
// Company & Candidate are blocked at the API (403), NOT just hidden in the UI.
export async function GET(req: Request) {
  const auth = await requireUser();
  if ("res" in auth) return auth.res;
  const user = auth.user;

  // Hard backend gate: only BIGLIGHT and CTV may read commissions.
  if (user.role === "COMPANY" || user.role === "CANDIDATE") {
    return forbidden("報酬情報へのアクセス権限がありません");
  }

  const scope = commissionScopeWhere(user);
  if (scope === null) return forbidden();

  const { searchParams } = new URL(req.url);
  const filters: Prisma.CandidateCommissionWhereInput[] = [scope];
  const companyId = searchParams.get("companyId");
  const ctvId = searchParams.get("ctvId");
  const paymentStatus = searchParams.get("paymentStatus");
  if (companyId) filters.push({ companyId });
  if (ctvId) filters.push({ ctvId });
  if (paymentStatus)
    filters.push({
      paymentStatus: paymentStatus as Prisma.CandidateCommissionWhereInput["paymentStatus"],
    });

  const rows = await prisma.candidateCommission.findMany({
    where: { AND: filters },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, code: true, title: true } },
      company: { select: { id: true, name: true } },
      candidate: { select: { id: true, name: true } },
      ctv: { select: { id: true, name: true } },
    },
  });

  return json({ commissions: rows });
}
