import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireUser,
  forbidden,
  json,
  jobScopeWhere,
  sanitizeJobs,
  denyByLevel,
} from "@/lib/api";
import { can, canSeeCommission } from "@/lib/permissions";

// GET /api/jobs — list jobs the current user is allowed to see (row-scoped),
// with sensitive fields stripped per role.
export async function GET(req: Request) {
  const auth = await requireUser();
  if ("res" in auth) return auth.res;
  const user = auth.user;

  if (!can(user.role, "view", "job")) return forbidden();

  const { searchParams } = new URL(req.url);
  const filters: Prisma.JobWhereInput[] = [jobScopeWhere(user)];

  const companyId = searchParams.get("companyId");
  const industry = searchParams.get("industry");
  const location = searchParams.get("location");
  const status = searchParams.get("status");
  const publicStatus = searchParams.get("publicStatus");
  const dorm = searchParams.get("dorm");
  const nightShift = searchParams.get("nightShift");
  const ctvId = searchParams.get("ctvId");
  const staffId = searchParams.get("staffId");
  const q = searchParams.get("q");

  if (companyId) filters.push({ companyId });
  if (industry) filters.push({ industry });
  if (location) filters.push({ location });
  if (status) filters.push({ status: status as Prisma.JobWhereInput["status"] });
  if (publicStatus)
    filters.push({ publicStatus: publicStatus as Prisma.JobWhereInput["publicStatus"] });
  if (dorm === "1") filters.push({ dormitoryAvailable: true });
  if (dorm === "0") filters.push({ dormitoryAvailable: false });
  if (nightShift === "1") filters.push({ nightShift: true });
  if (ctvId) filters.push({ ctvId });
  if (staffId) filters.push({ biglightStaffId: staffId });
  if (q)
    filters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    });

  const jobs = await prisma.job.findMany({
    where: { AND: filters },
    orderBy: { updatedAt: "desc" },
    include: {
      company: { select: { id: true, name: true } },
      biglightStaff: { select: { id: true, name: true } },
      ctv: { select: { id: true, name: true } },
      // only attach commissions if the role may ever see them
      jobCommissions: canSeeCommission(user.role),
      _count: { select: { applications: true } },
    },
  });

  return json({ jobs: sanitizeJobs(user, jobs as never) });
}

// POST /api/jobs — create a job (BIGLIGHT only).
export async function POST(req: Request) {
  const auth = await requireUser();
  if ("res" in auth) return auth.res;
  const user = auth.user;

  if (!can(user.role, "create", "job")) return forbidden();
  const denied = denyByLevel(user, "jobs.create");
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  if (!body.companyId || !body.title || !body.industry || !body.location) {
    return json({ error: "企業・業種・勤務地・タイトルは必須です" }, 400);
  }

  // generate a code if not supplied
  const code: string = body.code || `JOB-${Date.now().toString(36).toUpperCase()}`;

  const job = await prisma.job.create({
    data: {
      code,
      companyId: body.companyId,
      title: body.title,
      industry: body.industry,
      jobTypeName: body.jobTypeName ?? null,
      location: body.location,
      city: body.city ?? null,
      recruitCount: body.recruitCount ?? 1,
      recruitMale: body.recruitMale ?? 0,
      recruitFemale: body.recruitFemale ?? 0,
      hiredCount: body.hiredCount ?? 0,
      residenceType: body.residenceType ?? "TOKUTEI_1",
      payType: body.payType ?? null,
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      baseSalary: body.baseSalary ?? null,
      expectedMonthly: body.expectedMonthly ?? null,
      expectedTakeHome: body.expectedTakeHome ?? null,
      workHours: body.workHours ?? null,
      overtimeHours: body.overtimeHours ?? null,
      holidays: body.holidays ?? null,
      bonus: body.bonus ?? null,
      commuteMethod: body.commuteMethod ?? null,
      japaneseLevel: body.japaneseLevel ?? null,
      description: body.description ?? null,
      appealPoints: body.appealPoints ?? null,
      requiredQualification: body.requiredQualification ?? null,
      dormitoryAvailable: !!body.dormitoryAvailable,
      dormitoryFee: body.dormitoryFee ?? null,
      utilitiesCost: body.utilitiesCost ?? null,
      wifi: body.wifi ?? null,
      nightShift: !!body.nightShift,
      shiftWork: !!body.shiftWork,
      status: body.status ?? "OPEN",
      publicStatus: body.publicStatus ?? "DRAFT",
      isFeatured: !!body.isFeatured,
      isRecommended: !!body.isRecommended,
      isUrgent: !!body.isUrgent,
      imageUrl: body.imageUrl ?? null,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
      biglightStaffId: body.biglightStaffId ?? user.id,
      tags: body.tags ?? [],
      formData: body.formData ?? {},
      internalMemo: body.internalMemo ?? null,
      companyHistory: body.companyHistory ?? null,
      riskNotes: body.riskNotes ?? null,
    },
  });

  return json({ job }, 201);
}
