import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

// GET — GAS URL + quyền gửi mail của chính nhân viên đang đăng nhập.
export async function GET() {
  const g = await guard("dashboard.view");
  if (!g.ok) return g.res;
  const u = await prisma.user.findUnique({ where: { id: g.user.id }, select: { gasUrl: true, canSendMail: true } });
  return NextResponse.json({ gasUrl: u?.gasUrl ?? "", canSendMail: !!u?.canSendMail });
}

// POST { gasUrl } — lưu GAS URL của chính mình.
export async function POST(req: Request) {
  const g = await guard("dashboard.view");
  if (!g.ok) return g.res;
  const b = await req.json().catch(() => ({}));
  const gasUrl = String(b.gasUrl ?? "").trim();
  if (gasUrl && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(gasUrl)) {
    return NextResponse.json({ error: "GASのデプロイURL（https://script.google.com/macros/s/…/exec）を入力してください。" }, { status: 422 });
  }
  await prisma.user.update({ where: { id: g.user.id }, data: { gasUrl: gasUrl || null } });
  return NextResponse.json({ ok: true });
}
