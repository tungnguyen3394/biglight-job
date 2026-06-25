import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_STATUS_LABEL } from "@/lib/constants";
import Shell from "@/components/candidate/Shell";
import FbChat from "@/components/candidate/FbChat";
import CandidateLogin from "@/components/candidate/CandidateLogin";
import CandidateDashboard, { type AppView } from "@/components/candidate/CandidateDashboard";

export const dynamic = "force-dynamic";

const STAGE_OF: Record<string, number> = {
  NEW: 0, CONSULTING: 0,
  DOC_CHECK: 1, CV_SENT: 1,
  INTERVIEW_ARRANGING: 2, INTERVIEW_SCHEDULED: 2, INTERVIEWED: 2,
  OFFER: 3, CONTRACT: 3,
  VISA_APPLYING: 4, VISA_APPROVED: 4, JOIN_SCHEDULED: 4, JOINED: 4,
  REJECTED: 0, DECLINED: 0, CANCELLED: 0,
};
const ENDED = new Set(["REJECTED", "DECLINED", "CANCELLED"]);

export default async function MyPage({ searchParams }: { searchParams: { apply?: string; t?: string; applied?: string } }) {
  const session = await getSessionUser();

  // Lao động đã đăng nhập + có ?apply=<jobId> → tạo đơn ứng tuyển rồi làm sạch URL.
  if (session && session.role === "CANDIDATE" && searchParams.apply) {
    const candidate = await prisma.candidate.findUnique({ where: { userId: session.id } });
    if (candidate) {
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
      <Shell active="mypage">
        <CandidateLogin applyTitle={searchParams.t} />
        <FbChat />
      </Shell>
    );
  }

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.id },
    include: { applications: { include: { job: { include: { company: true } } }, orderBy: { createdAt: "desc" } } },
  });

  const apps: AppView[] = (candidate?.applications ?? []).map((a) => ({
    id: a.id,
    code: a.job.code,
    title: a.job.title,
    company: a.job.company.name,
    stage: STAGE_OF[a.status] ?? 0,
    statusLabel: APP_STATUS_LABEL[a.status] ?? a.status,
    ended: ENDED.has(a.status),
  }));

  return (
    <Shell active="mypage">
      <CandidateDashboard name={session.name} apps={apps} applied={searchParams.applied === "1"} />
      <FbChat />
    </Shell>
  );
}
