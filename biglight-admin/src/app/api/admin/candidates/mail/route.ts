import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { MAIL_GAS_SECRET } from "@/lib/mailGas";

export const dynamic = "force-dynamic";

// POST { ids:[], subject, body } — gửi mail hàng loạt cho ứng viên (qua webhook GAS).
// Reply-to = email nhân viên đang đăng nhập → ứng viên trả lời về đúng người.
export async function POST(req: Request) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;

  const b = await req.json().catch(() => ({}));
  const ids = Array.isArray(b.ids) ? b.ids.map(String) : [];
  const subject = String(b.subject ?? "").trim();
  const body = String(b.body ?? "").trim();
  if (!ids.length || !subject || !body) return NextResponse.json({ error: "宛先・件名・本文を入力してください。" }, { status: 422 });

  // GAS riêng của nhân viên đang đăng nhập (gửi từ Gmail của họ) + kiểm tra quyền.
  const me = await prisma.user.findUnique({ where: { id: g.user.id }, select: { gasUrl: true, canSendMail: true } });
  if (!me?.canSendMail) return NextResponse.json({ error: "メール送信が許可されていません（Adminにユーザー管理での許可を依頼してください）。" }, { status: 403 });
  if (!me.gasUrl) return NextResponse.json({ error: "メール設定でご自身のGAS URLを登録してください。" }, { status: 422 });

  const cands = await prisma.candidate.findMany({ where: { id: { in: ids } }, include: { user: { select: { email: true } } } });
  const emails = [...new Set(cands.map((c) => c.email || c.user?.email).filter((e): e is string => !!e))];
  if (!emails.length) return NextResponse.json({ error: "メールアドレスのある応募者がいません。" }, { status: 422 });

  try {
    const res = await fetch(me.gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: MAIL_GAS_SECRET, to: emails, subject, body, replyTo: g.user.email, name: `${g.user.name}（BIGLIGHT JOB）` }),
      cache: "no-store",
    });
    const txt = await res.text();
    if (!res.ok) return NextResponse.json({ error: `送信に失敗しました（HTTP ${res.status}）。` }, { status: 502 });
    let sent = emails.length;
    try {
      const j = JSON.parse(txt);
      if (j && j.ok === false) return NextResponse.json({ error: j.error || "GAS側でエラーが発生しました。" }, { status: 502 });
      if (j && typeof j.sent === "number") sent = j.sent;
    } catch { /* GAS có thể trả text — coi như thành công */ }
    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ error: "メールサーバー（GAS）に接続できませんでした。" }, { status: 502 });
  }
}
