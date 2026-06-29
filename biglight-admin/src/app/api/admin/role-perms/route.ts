import { NextResponse } from "next/server";
import { guard } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { EDITABLE_PERMS } from "@/lib/adminAccess";
import { getRolePerms, saveRolePerms } from "@/lib/rolePerms";

export const dynamic = "force-dynamic";

// users.role là quyền Admin-only (Staff/View không có) → guard này chỉ Admin qua được.
// GET — quyền hiện tại của Staff/View.
export async function GET() {
  const g = await guard("users.role");
  if (!g.ok) return g.res;
  return NextResponse.json({ perms: await getRolePerms() });
}

// PUT { level, perms } — lưu quyền cho 1 cấp (chỉ nhận quyền trong catalog cho phép chỉnh).
export async function PUT(req: Request) {
  const g = await guard("users.role");
  if (!g.ok) return g.res;
  const b = await req.json().catch(() => ({}));
  const level = b.level === "STAFF" ? "STAFF" : b.level === "VIEW" ? "VIEW" : null;
  if (!level) return NextResponse.json({ error: "level が不正です。" }, { status: 422 });

  const editable = new Set<string>(EDITABLE_PERMS as string[]);
  const incoming: string[] = Array.isArray(b.perms) ? b.perms.map(String) : [];
  const perms = [...new Set(incoming.filter((p) => editable.has(p)))];

  await saveRolePerms(level, perms);
  await logAudit({ actorId: g.user.id, actorName: g.user.name, action: "role.perms", targetType: "role", targetName: level, detail: `${level} の権限を更新（${perms.length}件）` });
  return NextResponse.json({ ok: true, level, perms });
}
