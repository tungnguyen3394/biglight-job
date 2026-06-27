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
  if (!setId || !value) return NextResponse.json({ error: "値を入力してください。" }, { status: 422 });

  const set = await prisma.optionSet.findUnique({ where: { id: setId } });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const max = await prisma.optionItem.aggregate({ where: { setId }, _max: { sortOrder: true } });
  const item = await prisma.optionItem.create({ data: { setId, value, sortOrder: (max._max.sortOrder ?? -1) + 1 } });
  return NextResponse.json({ item: { id: item.id, value: item.value, enabled: item.enabled, sortOrder: item.sortOrder } });
}
