import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isBiglight, denyByLevel } from "@/lib/api";
import { articleColumns } from "@/lib/articleSave";

// PUT /api/articles/[id] — cập nhật bài
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const denied = denyByLevel(user, "articles.update");
  if (denied) return denied;

  const b = await req.json().catch(() => ({}));
  await prisma.article.update({ where: { id: params.id }, data: articleColumns(b) });
  return NextResponse.json({ ok: true });
}

// DELETE /api/articles/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const denied = denyByLevel(user, "articles.delete");
  if (denied) return denied;

  await prisma.article.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
