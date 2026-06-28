import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

// POST { setId, value } — thêm 1 định nghĩa vào set. Chỉ Admin.
export async function POST(req: Request) {
  const g = await guard("settings.update");
  if (!g.ok) return g.res;

  const b = await req.json().catch(() => ({}));
  const setId = String(b.setId ?? "");
  const value = String(b.value ?? "").trim();
  const parentId = typeof b.parentId === "string" && b.parentId ? b.parentId : null;
  if (!setId || !value) return NextResponse.json({ error: "値を入力してください。" }, { status: 422 });

  const set = await prisma.optionSet.findUnique({ where: { id: setId } });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parentId) {
    const parent = await prisma.optionItem.findUnique({ where: { id: parentId } });
    if (!parent || parent.setId !== setId) return NextResponse.json({ error: "親項目が不正です。" }, { status: 422 });
  }

  const max = await prisma.optionItem.aggregate({ where: { setId, parentId }, _max: { sortOrder: true } });
  const item = await prisma.optionItem.create({ data: { setId, value, parentId, sortOrder: (max._max.sortOrder ?? -1) + 1 } });
  return NextResponse.json({ item: { id: item.id, value: item.value, enabled: item.enabled, sortOrder: item.sortOrder, parentId: item.parentId } });
}
