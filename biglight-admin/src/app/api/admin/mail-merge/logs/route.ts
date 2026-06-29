import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

const SCOPE = (s: unknown) => (s === "company" ? "company" : "candidate");
type Recipient = { id?: string; name?: string; email: string; status: "sent" | "failed" | "unsent" };

// GET ?scope — lịch sử gửi gần đây.
export async function GET(req: Request) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  const scope = SCOPE(new URL(req.url).searchParams.get("scope"));
  const logs = await prisma.mailSendLog.findMany({ where: { scope }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ logs });
}

// POST { scope, subject, body, recipients } — lưu lịch sử gửi (client gọi sau khi gửi xong).
export async function POST(req: Request) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  const b = await req.json().catch(() => ({}));
  const scope = SCOPE(b.scope);
  const recipients: Recipient[] = Array.isArray(b.recipients) ? b.recipients : [];
  const sentCount = recipients.filter((r) => r.status === "sent").length;
  const failedCount = recipients.filter((r) => r.status === "failed").length;
  const log = await prisma.mailSendLog.create({
    data: {
      scope, subject: String(b.subject ?? ""), body: String(b.body ?? ""),
      sentById: g.user.id, sentByName: g.user.name,
      total: recipients.length, sentCount, failedCount,
      recipients: recipients as unknown as object[],
    },
  });
  return NextResponse.json({ log });
}
