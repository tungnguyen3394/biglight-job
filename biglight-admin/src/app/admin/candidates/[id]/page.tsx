import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { APP_STATUS_LABEL } from "@/lib/constants";
import { computeCompletion, type DocFile } from "@/lib/adminCandidate";
import { Forbidden } from "@/components/admin/Forbidden";
import { CandidateDetail, type DetailData } from "@/components/admin/CandidateDetail";

export const dynamic = "force-dynamic";
const ymd = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role === "CANDIDATE" || !can(user.role, "view", "candidate")) return <Forbidden />;

  const c = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { user: true, applications: { include: { job: { include: { company: true } } }, orderBy: { createdAt: "desc" } } },
  });
  if (!c) return <Forbidden />;

  const docs = (c.documents as Record<string, DocFile[]>) || {};
  const completion = computeCompletion({
    name: c.name, kana: c.kana, gender: c.gender, birthdate: c.birthdate, nationality: c.nationality,
    phone: c.phone, email: c.email, visaType: c.visaType, visaExpiryDate: c.visaExpiryDate,
    currentTokuteiField: c.currentTokuteiField, japaneseLevel: c.japaneseLevel,
    desiredLocation: c.desiredLocation, desiredIndustry: c.desiredIndustry, desiredSalary: c.desiredSalary,
    canChangeJobFrom: c.canChangeJobFrom, documents: docs,
  });

  const data: DetailData = {
    id: c.id,
    image: c.user?.image ?? null,
    name: c.name,
    kana: c.kana ?? "",
    gender: c.gender ?? "ANY",
    birthdate: ymd(c.birthdate),
    nationality: c.nationality ?? "",
    phone: c.phone ?? "",
    email: c.email ?? c.user?.email ?? "",
    visaType: c.visaType ?? "",
    visaExpiryDate: ymd(c.visaExpiryDate),
    currentTokuteiField: c.currentTokuteiField ?? "",
    japaneseLevel: c.japaneseLevel ?? "",
    desiredLocation: c.desiredLocation ?? "",
    desiredIndustry: c.desiredIndustry ?? "",
    desiredSalary: c.desiredSalary ? Math.round(c.desiredSalary / 10000) : 0,
    canChangeJobFrom: ymd(c.canChangeJobFrom),
    internalMemo: c.internalMemo ?? "",
    status: c.status,
    zairyuDocs: (docs.zairyu ?? []).map((d) => ({ name: d.name, file: d.file })),
    apps: c.applications.map((a) => ({
      id: a.id,
      code: a.job.code,
      title: a.job.title,
      company: a.job.company.name,
      status: a.status,
      statusLabel: APP_STATUS_LABEL[a.status] ?? a.status,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  const canEdit = can(user.role, "update", "candidate");
  const canDelete = can(user.role, "delete", "candidate");

  return <CandidateDetail data={data} completion={completion} canEdit={canEdit} canDelete={canDelete} />;
}
