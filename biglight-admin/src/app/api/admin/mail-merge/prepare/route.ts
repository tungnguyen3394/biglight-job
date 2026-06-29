import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { MAIL_GAS_SECRET } from "@/lib/mailGas";
import { getMergeFields, fmtValue } from "@/lib/mailMergeServer";
import type { MergeScope, MergeRecipient } from "@/lib/mailMerge";

export const dynamic = "force-dynamic";

// POST { scope, ids } — kiểm quyền + lấy field (tự DB) + gom người nhận (đã loại trùng email).
export async function POST(req: Request) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;

  const b = await req.json().catch(() => ({}));
  const scope: MergeScope = b.scope === "company" ? "company" : "candidate";
  const ids = Array.isArray(b.ids) ? b.ids.map(String) : [];
  if (!ids.length) return NextResponse.json({ error: "宛先を選択してください。" }, { status: 422 });

  const me = await prisma.user.findUnique({ where: { id: g.user.id }, select: { gasUrl: true, canSendMail: true } });
  if (!me?.canSendMail) return NextResponse.json({ error: "メール送信が許可されていません（Adminにユーザー管理での許可を依頼してください）。" }, { status: 403 });
  if (!me.gasUrl) return NextResponse.json({ error: "メール設定でご自身のGAS URLを登録してください。" }, { status: 422 });

  const fields = getMergeFields(scope);
  const cols = fields.map((f) => f.col);

  let recipients: MergeRecipient[] = [];
  if (scope === "candidate") {
    const rows = await prisma.candidate.findMany({ where: { id: { in: ids } }, include: { user: { select: { email: true } } } });
    recipients = rows.map((r) => {
      const rec = r as unknown as Record<string, unknown>;
      const values: Record<string, string> = {};
      for (const c of cols) values[c] = fmtValue(rec[c]);
      return { id: r.id, name: r.name || "", email: (r.email || r.user?.email || "").trim(), values };
    });
  } else {
    const rows = await prisma.company.findMany({ where: { id: { in: ids } } });
    recipients = rows.map((r) => {
      const rec = r as unknown as Record<string, unknown>;
      const values: Record<string, string> = {};
      for (const c of cols) values[c] = fmtValue(rec[c]);
      return { id: r.id, name: r.name || "", email: (r.email || "").trim(), values };
    });
  }

  // Bỏ người không có email + loại trùng email (giữ người đầu tiên).
  const seen = new Set<string>();
  const deduped = recipients.filter((r) => {
    const e = r.email.toLowerCase();
    if (!e || seen.has(e)) return false;
    seen.add(e);
    return true;
  });
  if (!deduped.length) return NextResponse.json({ error: "メールアドレスのある宛先がいません。" }, { status: 422 });

  return NextResponse.json({
    gasUrl: me.gasUrl, secret: MAIL_GAS_SECRET, replyTo: g.user.email,
    name: `${g.user.name}（BIGLIGHT JOB）`, staffEmail: g.user.email,
    fields, recipients: deduped,
  });
}
