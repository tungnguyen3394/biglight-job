import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

// PATCH { value? | enabled? | move:"up"|"down" } — đổi tên / bật-tắt / sắp xếp. Chỉ Admin.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("settings.update");
  if (!g.ok) return g.res;

  const b = await req.json().catch(() => ({}));

  if (b.move === "up" || b.move === "down") {
    const cur = await prisma.optionItem.findUnique({ where: { id: params.id } });
    if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const neighbor = await prisma.optionItem.findFirst({
      where: { setId: cur.setId, sortOrder: b.move === "up" ? { lt: cur.sortOrder } : { gt: cur.sortOrder } },
      orderBy: { sortOrder: b.move === "up" ? "desc" : "asc" },
    });
    if (neighbor) {
      await prisma.$transaction([
        prisma.optionItem.update({ where: { id: cur.id }, data: { sortOrder: neighbor.sortOrder } }),
        prisma.optionItem.update({ where: { id: neighbor.id }, data: { sortOrder: cur.sortOrder } }),
      ]);
    }
    return NextResponse.json({ ok: true });
  }

  const data: { value?: string; enabled?: boolean } = {};
  if (typeof b.value === "string" && b.value.trim()) data.value = b.value.trim();
  if (typeof b.enabled === "boolean") data.enabled = b.enabled;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No change" }, { status: 400 });

  await prisma.optionItem.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE — xoá 1 định nghĩa. Chỉ Admin.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard("settings.update");
  if (!g.ok) return g.res;
  await prisma.optionItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
