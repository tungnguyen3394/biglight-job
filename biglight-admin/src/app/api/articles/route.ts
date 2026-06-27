import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isBiglight, denyByLevel } from "@/lib/api";
import { articleColumns } from "@/lib/articleSave";

// POST /api/articles — tạo bài mới
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const denied = denyByLevel(user, "articles.create");
  if (denied) return denied;

  const b = await req.json().catch(() => ({}));
  const created = await prisma.article.create({ data: { ...articleColumns(b), authorUserId: user.id } });
  return NextResponse.json({ id: created.id });
}
