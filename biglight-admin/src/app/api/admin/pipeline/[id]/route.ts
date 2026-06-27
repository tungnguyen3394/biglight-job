import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { notify } from "@/lib/notify";
import { bucket, PIPE_LABEL } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
function toDate(s: unknown): Date | null {
  if (!s || typeof s !== "string") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// GET — chi tiết 1 đơn (panel phải): hồ sơ + 求人 + 担当者 + timeline + tin nhắn gần nhất.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard("applicants.read");
  if (!g.ok) return g.res;

  const a = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      candidate: { include: { user: { select: { image: true, email: true } } } },
      job: { select: { id: true, title: true, code: true, location: true, city: true, industry: true } },
      company: { select: { name: true } },
      biglightStaff: { select: { id: true, name: true, image: true } },
      statusHistories: { orderBy: { changedAt: "desc" } },
    },
  });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ids = [...new Set(a.statusHistories.map((h) => h.changedBy).filter((x): x is string => !!x))];
  const hUsers = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
  const hName = new Map(hUsers.map((u) => [u.id, u.name]));
  const conv = await prisma.conversation.findUnique({ where: { candidateId: a.candidateId }, select: { lastMessage: true, lastMessageAt: true } });

  const c = a.candidate;
  const prefs = (c.prefs as Record<string, unknown>) || {};
  return NextResponse.json({
    id: a.id,
    status: a.status,
    staffId: a.biglightStaffId,
    nextActionDate: isoDay(a.nextActionDate),
    interviewDate: isoDay(a.interviewDate),
    offerDate: isoDay(a.offerDate),
    visaApplicationDate: isoDay(a.visaApplicationDate),
    joinDate: isoDay(a.joinDate),
    internalMemo: a.internalMemo,
    applicantNote: a.applicantNote,
    candidate: {
      id: c.id, name: c.name, kana: c.kana, nationality: c.nationality, phone: c.phone,
      email: c.email ?? c.user?.email ?? null, image: c.user?.image ?? null,
      japaneseLevel: c.japaneseLevel, visaType: c.visaType,
      facebookUrl: c.facebookUrl, instagramUrl: (prefs.instagramUrl as string) ?? null, tiktokUrl: (prefs.tiktokUrl as string) ?? null,
      hasDocs: c.documents && Object.keys(c.documents as object).length > 0,
    },
    job: a.job,
    company: a.company.name,
    staff: a.biglightStaff,
    lastMessage: conv?.lastMessage ?? null,
    lastMessageAt: conv?.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
    timeline: a.statusHistories.map((h) => ({ id: h.id, oldStatus: h.oldStatus, newStatus: h.newStatus, memo: h.memo, by: h.changedBy ? hName.get(h.changedBy) ?? null : null, at: h.changedAt.toISOString() })),
  });
}

// PATCH — đổi trạng thái / 担当者 / ngày / 社内メモ / ghi chú timeline. Lưu lịch sử.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("applicants.update");
  if (!g.ok) return g.res;

  const a = await prisma.application.findUnique({ where: { id: params.id } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  const hist: { applicationId: string; oldStatus: string | null; newStatus: string; changedBy: string; memo: string | null }[] = [];

  if (typeof b.status === "string" && b.status !== a.status) {
    data.status = b.status;
    hist.push({ applicationId: a.id, oldStatus: a.status, newStatus: b.status, changedBy: g.user.id, memo: typeof b.note === "string" && b.note.trim() ? b.note.trim() : null });
  }
  if ("staffId" in b && (b.staffId || null) !== a.biglightStaffId) {
    data.biglightStaffId = b.staffId || null;
    let nm = "未割当";
    if (b.staffId) { const u = await prisma.user.findUnique({ where: { id: b.staffId }, select: { name: true } }); nm = u?.name ?? "担当者"; }
    hist.push({ applicationId: a.id, oldStatus: null, newStatus: "ASSIGN", changedBy: g.user.id, memo: `担当者を ${nm} に変更` });
  }
  for (const k of ["nextActionDate", "interviewDate", "offerDate", "visaApplicationDate", "joinDate"]) {
    if (k in b) data[k] = toDate(b[k]);
  }
  if ("internalMemo" in b) data.internalMemo = typeof b.internalMemo === "string" ? b.internalMemo : null;
  if (typeof b.note === "string" && b.note.trim() && !b.status) {
    hist.push({ applicationId: a.id, oldStatus: null, newStatus: "NOTE", changedBy: g.user.id, memo: b.note.trim() });
  }

  if (Object.keys(data).length) await prisma.application.update({ where: { id: a.id }, data });
  if (hist.length) await prisma.statusHistory.createMany({ data: hist });

  if (typeof data.status === "string") {
    const cand = await prisma.candidate.findUnique({ where: { id: a.candidateId }, select: { userId: true } });
    await notify(cand?.userId, { type: "status", title: "選考状況が更新されました", body: PIPE_LABEL[bucket(data.status)] ?? "", link: "/mypage?sec=apps" });
  }
  return NextResponse.json({ ok: true });
}
