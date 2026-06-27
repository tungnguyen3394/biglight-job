import { prisma } from "@/lib/prisma";
import { requireUser, forbidden, json, sanitizeJob, jobScopeWhere, denyByLevel } from "@/lib/api";
import { can, canSeeCommission } from "@/lib/permissions";

async function loadScopedJob(userId: string, role: string, companyId: string | null, ctvId: string | null, id: string) {
  return prisma.job.findFirst({
    where: {
      AND: [
        { id },
        jobScopeWhere({ id: userId, role: role as never, companyId, ctvId, name: "", email: "" }),
      ],
    },
    include: {
      company: { select: { id: true, name: true } },
      biglightStaff: { select: { id: true, name: true } },
      ctv: { select: { id: true, name: true } },
      jobCommissions: canSeeCommission(role as never),
    },
  });
}

// GET /api/jobs/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("res" in auth) return auth.res;
  const user = auth.user;
  if (!can(user.role, "view", "job")) return forbidden();

  const job = await loadScopedJob(user.id, user.role, user.companyId, user.ctvId, params.id);
  if (!job) return forbidden("この求人を閲覧する権限がありません");
  return json({ job: sanitizeJob(user, job as never) });
}

// PUT /api/jobs/:id — update. Company edits go to 承認待ち (PENDING_APPROVAL).
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("res" in auth) return auth.res;
  const user = auth.user;
  if (!can(user.role, "update", "job")) return forbidden();
  const deniedUpd = denyByLevel(user, "jobs.update");
  if (deniedUpd) return deniedUpd;

  // must be within scope (e.g. company can only touch own jobs)
  const existing = await loadScopedJob(user.id, user.role, user.companyId, user.ctvId, params.id);
  if (!existing) return forbidden("この求人を編集する権限がありません");

  const body = await req.json().catch(() => ({}));

  // Whitelist editable fields by role.
  const data: Record<string, unknown> = {};
  const basic = [
    "title", "jobTypeName", "location", "city", "recruitCount", "recruitMale",
    "recruitFemale", "hiredCount", "employmentType", "residenceType",
    "description", "dailyFlow", "requiredExperience", "requiredQualification",
    "japaneseLevel", "ageMin", "ageMax", "genderCondition", "nationalityCondition",
    "baseSalary", "expectedMonthly", "expectedTakeHome", "salaryMin", "salaryMax",
    "overtimeHours", "bonus", "raise", "socialInsurance", "transportAllowance",
    "holidays", "paidLeave", "workHours", "nightShift", "shiftWork",
    "alternatingShift", "hasOvertime", "startDate", "dormitoryAvailable",
    "dormitoryFee", "utilitiesCost", "wifi", "commuteMethod", "stationDistance",
    "bicycleLease", "pickupService", "publicMemo", "appealPoints", "applyNotes",
    "tags", "payType", "formData", "isFeatured", "isRecommended", "imageUrl", "seoTitle", "seoDescription",
  ];
  for (const k of basic) if (k in body) data[k] = body[k];

  // BIGLIGHT-only fields
  if (user.role === "SUPER_ADMIN" || user.role === "MANAGER" || user.role === "BIGLIGHT_STAFF") {
    for (const k of ["internalMemo", "companyHistory", "riskNotes", "status", "isUrgent", "publicStatus", "biglightStaffId", "ctvId", "code", "industry", "companyId"]) {
      if (k in body) data[k] = body[k];
    }
  }

  // Company edits require re-approval before going public.
  if (user.role === "COMPANY") {
    data.publicStatus = "PENDING_APPROVAL";
  }

  const job = await prisma.job.update({ where: { id: params.id }, data });
  return json({ job: sanitizeJob(user, job as never) });
}

// DELETE /api/jobs/:id — BIGLIGHT only (CTV/Company/Candidate cannot delete).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("res" in auth) return auth.res;
  const user = auth.user;
  if (!can(user.role, "delete", "job")) return forbidden("削除権限がありません");
  const deniedDel = denyByLevel(user, "jobs.delete");
  if (deniedDel) return deniedDel;

  await prisma.job.delete({ where: { id: params.id } });
  return json({ ok: true });
}
