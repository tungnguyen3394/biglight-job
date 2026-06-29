import { prisma } from "./prisma";
import { setRolePermsCache, DEFAULT_PERMS } from "./adminAccess";

// App chạy 1 Docker process → cache module nhất quán. Nạp override từ DB 1 lần (refresh khi lưu).
let loaded = false;

export async function loadRolePerms(force = false): Promise<void> {
  if (loaded && !force) return;
  try {
    const rows = await prisma.rolePerm.findMany({ where: { level: { in: ["STAFF", "VIEW"] } } });
    const map: { STAFF?: string[]; VIEW?: string[] } = {};
    for (const r of rows) if (r.level === "STAFF" || r.level === "VIEW") map[r.level] = r.perms;
    setRolePermsCache(map);
    loaded = true;
  } catch { /* DB lỗi → giữ mặc định hard-code */ }
}

// Quyền hiện tại của Staff/View (fallback mặc định nếu chưa từng lưu) — cho UI.
export async function getRolePerms(): Promise<{ STAFF: string[]; VIEW: string[] }> {
  const rows = await prisma.rolePerm.findMany({ where: { level: { in: ["STAFF", "VIEW"] } } });
  const m: Record<string, string[]> = {};
  for (const r of rows) m[r.level] = r.perms;
  return { STAFF: m.STAFF ?? DEFAULT_PERMS.STAFF, VIEW: m.VIEW ?? DEFAULT_PERMS.VIEW };
}

export async function saveRolePerms(level: "STAFF" | "VIEW", perms: string[]): Promise<void> {
  await prisma.rolePerm.upsert({ where: { level }, create: { level, perms }, update: { perms } });
  await loadRolePerms(true); // refresh cache ngay
}
