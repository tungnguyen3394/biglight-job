import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_STATUS_LABEL } from "@/lib/constants";
import { salaryRange } from "@/lib/site";
import { isProfileComplete } from "@/lib/candidateProfile";
import { STAGE_OF, ENDED_STATUSES, type FlowEvent } from "@/lib/applicationFlow";
import { getAllOptions, getSswTree } from "@/lib/options";
import Shell from "@/components/candidate/Shell";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import CandidateLogin from "@/components/candidate/CandidateLogin";
import CandidateDashboard, { type AppView, type SavedJob } from "@/components/candidate/CandidateDashboard";
import { type ProfileInit } from "@/components/candidate/CandidateProfileForm";
import { type DocMap } from "@/components/candidate/CandidateDocuments";

const ymd = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export const dynamic = "force-dynamic";

export default async function MyPage({ searchParams }: { searchParams: { apply?: string; t?: string; applied?: string; fberror?: string; gerror?: string; redirect?: string; need?: string; sec?: string } }) {
  const session = await getSessionUser();

  // Lao động đã đăng nhập + có ?apply=<jobId> → tạo đơn ứng tuyển rồi làm sạch URL.
  if (session && session.role === "CANDIDATE" && searchParams.apply) {
    const candidate = await prisma.candidate.findUnique({ where: { userId: session.id }, include: { user: true } });
    if (candidate) {
      // Hồ sơ chưa đủ → sang màn hình hoàn thiện hồ sơ (không tạo đơn).
      if (!isProfileComplete(candidate, candidate.user)) redirect("/mypage?need=1");
      // Chỉ ứng tuyển求人 đã công khai (không lọt tin nội bộ/nháp).
      const job = await prisma.job.findFirst({ where: { id: searchParams.apply, publicStatus: "PUBLIC" } });
      if (job) {
        const exists = await prisma.application.findFirst({ where: { candidateId: candidate.id, jobId: job.id } });
        if (!exists) {
          await prisma.application.create({ data: { candidateId: candidate.id, jobId: job.id, companyId: job.companyId, status: "NEW" } });
          // Bỏ khỏi お気に入り cho đồng bộ với API ứng tuyển.
          const saved = (candidate.savedJobIds ?? []).filter((x) => x !== job.id);
          if (saved.length !== (candidate.savedJobIds ?? []).length) await prisma.candidate.update({ where: { id: candidate.id }, data: { savedJobIds: saved } });
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
    include: {
      user: true,
      applications: {
        include: { job: { include: { company: true } }, statusHistories: { orderBy: { changedAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const apps: AppView[] = (candidate?.applications ?? []).map((a) => {
    // Dòng thời gian: mốc 応募 (lúc tạo đơn, ghi chú = lời nhắn ứng tuyển) + các lần admin đổi trạng thái (kèm memo).
    const timeline: FlowEvent[] = [
      { status: "NEW", label: "応募", at: ymd(a.createdAt), memo: a.applicantNote ?? null },
      ...a.statusHistories
        // Ẩn mốc NEW (đã có) và ASSIGN (đổi担当者 — nội bộ). NOTE = ghi chú担当者 gửi ứng viên.
        .filter((h) => h.newStatus !== "NEW" && h.newStatus !== "ASSIGN")
        .map((h) => ({
          status: h.newStatus,
          label: h.newStatus === "NOTE" ? "担当者からのお知らせ" : (APP_STATUS_LABEL[h.newStatus] ?? h.newStatus),
          at: ymd(h.changedAt),
          memo: h.memo ?? null,
        })),
    ];
    return {
      id: a.id,
      jobId: a.jobId,
      code: a.job.code,
      title: a.job.title,
      company: a.job.company.name,
      stage: STAGE_OF[a.status] ?? 0,
      statusLabel: APP_STATUS_LABEL[a.status] ?? a.status,
      ended: ENDED_STATUSES.has(a.status),
      timeline,
    };
  });

  const p = (candidate?.prefs as Record<string, unknown>) || {};
  const sArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

  // Email: Google (và FB có email) → email thật, khóa readonly. FB không email → user nhập tay.
  const synthetic = candidate?.user?.email?.endsWith(".biglight.local") ?? true;
  const emailLocked = !!candidate?.user && !synthetic;
  const formEmail = emailLocked ? candidate!.user!.email : (candidate?.email ?? "");

  const profile: ProfileInit = {
    name: candidate?.name ?? session.name,
    kana: candidate?.kana ?? "",
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
  const sswTree = await getSswTree(); // 特定技能分野（3階層）từ 設定

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
        sswTree={sswTree}
      />
      <MessengerPopupButton />
    </Shell>
  );
}
