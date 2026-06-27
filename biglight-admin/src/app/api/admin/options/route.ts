import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { ensureOptionSets, OPTION_SETS } from "@/lib/options";

export const dynamic = "force-dynamic";

// GET — toàn bộ option-set + item (cả disabled) để quản lý ở 設定. Chỉ Admin.
export async function GET() {
  const g = await guard("settings.view");
  if (!g.ok) return g.res;

  await ensureOptionSets();
  const sets = await prisma.optionSet.findMany({ include: { items: { orderBy: { sortOrder: "asc" } } } });
  const hintByKey = new Map(OPTION_SETS.map((s) => [s.key, s.hint]));
  // giữ thứ tự theo OPTION_SETS
  const ordered = OPTION_SETS.map((def) => sets.find((s) => s.key === def.key)).filter(Boolean) as typeof sets;

  return NextResponse.json({
    sets: ordered.map((s) => ({
      id: s.id,
      key: s.key,
      label: s.label,
      hint: hintByKey.get(s.key as never) ?? "",
      items: s.items.map((i) => ({ id: i.id, value: i.value, enabled: i.enabled, sortOrder: i.sortOrder })),
    })),
  });
}
