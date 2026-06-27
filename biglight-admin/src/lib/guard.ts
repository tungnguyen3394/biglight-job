// Guard dùng trong API route / server action. Kiểm tra quyền Ở SERVER — không
// cho Staff/View gọi API của Admin bằng cách gõ URL thủ công.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel, adminCan, type Permission, type AdminLevel } from "@/lib/adminAccess";
import type { SessionUser } from "@/lib/permissions";

export type GuardOk = { ok: true; user: SessionUser; level: AdminLevel };
export type GuardFail = { ok: false; res: NextResponse };

// Trả về { ok:true, user, level } nếu được phép; ngược lại { ok:false, res } với
// 401 (chưa đăng nhập) hoặc 403 (không đủ quyền). Dùng:
//   const g = await guard("users.create"); if (!g.ok) return g.res;
export async function guard(perm: Permission): Promise<GuardOk | GuardFail> {
  const user = await getSessionUser();
  if (!user) return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const level = effectiveAdminLevel(user);
  if (!level || !adminCan(level, perm)) {
    return { ok: false, res: NextResponse.json({ error: "Forbidden", perm }, { status: 403 }) };
  }
  return { ok: true, user, level };
}
