import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { MAIL_GAS_SECRET } from "@/lib/mailGas";

export const dynamic = "force-dynamic";

// POST { ids } — kiểm tra quyền + gom email công ty, trả tham số để CLIENT gọi GAS của nhân viên.
export async function POST(req: Request) {
  const g = await guard("companies.read");
  if (!g.ok) return g.res;

  const b = await req.json().catch(() => ({}));
  const ids = Array.isArray(b.ids) ? b.ids.map(String) : [];
  if (!ids.length) return NextResponse.json({ error: "宛先を選択してください。" }, { status: 422 });

  const me = await prisma.user.findUnique({ where: { id: g.user.id }, select: { gasUrl: true, canSendMail: true } });
  if (!me?.canSendMail) return NextResponse.json({ error: "メール送信が許可されていません（Adminにユーザー管理での許可を依頼してください）。" }, { status: 403 });
  if (!me.gasUrl) return NextResponse.json({ error: "メール設定でご自身のGAS URLを登録してください。" }, { status: 422 });

  const companies = await prisma.company.findMany({ where: { id: { in: ids } }, select: { email: true } });
  const emails = [...new Set(companies.map((c) => c.email).filter((e): e is string => !!e))];
  if (!emails.length) return NextResponse.json({ error: "メールアドレスのある企業がいません。" }, { status: 422 });

  return NextResponse.json({ gasUrl: me.gasUrl, emails, secret: MAIL_GAS_SECRET, replyTo: g.user.email, name: `${g.user.name}（BIGLIGHT JOB）` });
}
