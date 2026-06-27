import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_STATUS_LABEL } from "@/lib/constants";
import { salaryRange } from "@/lib/site";
import { isProfileComplete } from "@/lib/candidateProfile";
import { getAllOptions } from "@/lib/options";
import Shell from "@/components/candidate/Shell";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import CandidateLogin from "@/components/candidate/CandidateLogin";
import CandidateDashboard, { type AppView, type SavedJob } from "@/components/candidate/CandidateDashboard";
import { type ProfileInit } from "@/components/candidate/CandidateProfileForm";
import { type DocMap } from "@/components/candidate/CandidateDocuments";

const ymd = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export const dynamic = "force-dynamic";

// 6 bước: 応募→面談→面接→内定→ビザ申請中→入社
const STAGE_OF: Record<string, number> = {
  NEW: 0,
  CONSULTING: 1, DOC_CHECK: 1, CV_SENT: 1,
  INTERVIEW_ARRANGING: 2, INTERVIEW_SCHEDULED: 2, INTERVIEWED: 2,
  OFFER: 3, CONTRACT: 3,
  VISA_APPLYING: 4, VISA_APPROVED: 4,
  JOIN_SCHEDULED: 5, JOINED: 5,
  REJECTED: 0, DECLINED: 0, CANCELLED: 0,
};
const ENDED = new Set(["REJECTED", "DECLINED", "CANCELLED"]);

export default async function MyPage({ searchParams }: { searchParams: { apply?: string; t?: string; applied?: string; fberror?: string; gerror?: string; redirect?: string; need?: string; sec?: string } }) {
  const session = await getSessionUser();

  // Lao động đã đăng nhập + có ?apply=<jobId> → tạo đơn ứng tuyển rồi làm sạch URL.
  if (session && session.role === "CANDIDATE" && searchParams.apply) {
    const candidate = await prisma.candidate.findUnique({ where: { userId: session.id }, include: { user: true } });
    if (candidate) {
      // Hồ sơ chưa đủ → sang màn hình hoàn thiện hồ sơ (không tạo đơn).
      if (!isProfileComplete(candidate, candidate.user)) redirect("/mypage?need=1");
      const job = await prisma.job.findUnique({ where: { id: searchParams.apply } });
      if (job) {
        const exists = await prisma.application.findFirst({ where: { candidateId: candidate.id, jobId: job.id } });
        if (!exists) {
          await prisma.application.create({ data: { candidateId: candidate.id, jobId: job.id, companyId: job.companyId, status: "NEW" } });
        }
      }
    }
    redirect("/mypage?applied=1");
  }

  // Chưa đăng nhập (hoặc không phải lao động) → màn hình đăng nhập.
  if (!session || session.role !== "CANDIDATE") {
    return (
      <Shell active="mypage" loggedIn={false}>
        <CandidateLogin applyTitle={searchParams.t} fbError={searchParams.fberror || searchParams.gerror ? "1" : undefined} redirect={searchParams.redirect ?? "/mypage"} />
        <MessengerPopupButton />
      </Shell>
    );
  }

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.id },
    include: { user: true, applications: { include: { job: { include: { company: true } } }, orderBy: { createdAt: "desc" } } },
  });

  const apps: AppView[] = (candidate?.applications ?? []).map((a) => ({
    id: a.id,
    jobId: a.jobId,
    code: a.job.code,
    title: a.job.title,
    company: a.job.company.name,
    stage: STAGE_OF[a.status] ?? 0,
    statusLabel: APP_STATUS_LABEL[a.status] ?? a.status,
    ended: ENDED.has(a.status),
  }));

  const p = (candidate?.prefs as Record<string, unknown>) || {};
  const sArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

  // Email: Google (và FB có email) → email thật, khóa readonly. FB không email → user nhập tay.
  const synthetic = candidate?.user?.email?.endsWith(".biglight.local") ?? true;
  const emailLocked = !!candidate?.user && !synthetic;
  const formEmail = emailLocked ? candidate!.user!.email : (candidate?.email ?? "");

  const profile: ProfileInit = {
    name: candidate?.name ?? session.name,
    birth: ymd(candidate?.birthdate),
    gender: candidate?.gender ?? "ANY",
    nat: candidate?.nationality ?? "",
    phone: candidate?.phone ?? "",
    email: formEmail,
    address: candidate?.currentAddress ?? "",
    facebookUrl: candidate?.facebookUrl ?? "",
    instagramUrl: (p.instagramUrl as string) ?? "",
    tiktokUrl: (p.tiktokUrl as string) ?? "",
    visa: candidate?.visaType ?? "",
    sswField: (p.sswField as string) ?? candidate?.currentTokuteiField ?? "",
    sswCategory: (p.sswCategory as string) ?? "",
    sswTask: (p.sswTask as string) ?? "",
    otherSkills: (p.otherSkills as string) ?? "",
    expiry: ymd(candidate?.visaExpiryDate),
    arrival: (p.arrival as string) ?? "",
    jp: candidate?.japaneseLevel ?? "",
    fields: candidate?.desiredIndustry ? candidate.desiredIndustry.split(",").filter(Boolean) : [],
    areas: candidate?.desiredLocation ? candidate.desiredLocation.split(",").filter(Boolean) : [],
    desiredJobType: (p.desiredJobType as string) ?? "",
    sal: candidate?.desiredSalary ? Math.round(candidate.desiredSalary / 10000) : 0,
    dorm: (p.dorm as string) ?? "",
    start: (p.start as string) ?? "",
    nightshift: (p.nightshift as string) ?? "",
    shiftwork: (p.shiftwork as string) ?? "",
    reasons: sArr(p.reasons),
    reasonOther: (p.reasonOther as string) ?? "",
    priorities: sArr(p.priorities),
  };

  const docs = ((candidate?.documents as DocMap) ?? {}) as DocMap;

  // お気に入り求人 (việc đã lưu)
  const savedIds = candidate?.savedJobIds ?? [];
  const savedRaw = savedIds.length
    ? await prisma.job.findMany({ where: { id: { in: savedIds }, publicStatus: "PUBLIC" } })
    : [];
  const saved: SavedJob[] = savedRaw.map((j) => ({
    id: j.id,
    title: j.title,
    industry: j.industry,
    location: j.location,
    city: j.city,
    salaryMain: j.payType && j.baseSalary ? `${j.payType} ¥${j.baseSalary.toLocaleString("ja-JP")}` : salaryRange(j.salaryMin, j.salaryMax),
  }));

  const complete = candidate ? isProfileComplete(candidate, candidate.user) : false;
  const fieldOptions = await getAllOptions(); // 国籍・在留資格・日本語・業種 từ 設定 (đồng bộ)

  return (
    <Shell active="mypage" loggedIn={true}>
      <CandidateDashboard
        name={session.name}
        apps={apps}
        applied={searchParams.applied === "1"}
        profile={profile}
        docs={docs}
        saved={saved}
        emailLocked={emailLocked}
        complete={complete}
        needProfile={searchParams.need === "1"}
        initialSec={searchParams.sec}
        fieldOptions={fieldOptions}
      />
      <MessengerPopupButton />
    </Shell>
  );
}
