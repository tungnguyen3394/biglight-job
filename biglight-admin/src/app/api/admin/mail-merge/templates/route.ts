import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

const SCOPE = (s: unknown) => (s === "company" ? "company" : "candidate");

// GET ?scope — danh sách mẫu email theo scope.
export async function GET(req: Request) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  const scope = SCOPE(new URL(req.url).searchParams.get("scope"));
  const templates = await prisma.mailTemplate.findMany({ where: { scope }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ templates });
}

// POST { scope, name, subject, body, emptyMode } — lưu mẫu mới.
export async function POST(req: Request) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  const b = await req.json().catch(() => ({}));
  const scope = SCOPE(b.scope);
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "テンプレート名を入力してください。" }, { status: 422 });
  const t = await prisma.mailTemplate.create({
    data: {
      scope, name,
      subject: String(b.subject ?? ""), body: String(b.body ?? ""),
      emptyMode: b.emptyMode === "placeholder" ? "placeholder" : "blank",
      createdById: g.user.id,
    },
  });
  return NextResponse.json({ template: t });
}

// DELETE ?id — xoá mẫu (chỉ người tạo hoặc Admin).
export async function DELETE(req: Request) {
  const g = await guard("messages.reply");
  if (!g.ok) return g.res;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id が必要です。" }, { status: 400 });
  const t = await prisma.mailTemplate.findUnique({ where: { id }, select: { createdById: true } });
  if (!t) return NextResponse.json({ ok: true }); // đã không còn
  if (g.level !== "ADMIN" && t.createdById !== g.user.id) {
    return NextResponse.json({ error: "自分が作成したテンプレートのみ削除できます（または管理者）。" }, { status: 403 });
  }
  await prisma.mailTemplate.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
