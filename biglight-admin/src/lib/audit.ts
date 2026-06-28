import { prisma } from "./prisma";

// Ghi nhật ký thao tác (audit log). Không chặn nghiệp vụ nếu ghi lỗi.
export async function logAudit(a: {
  actorId?: string | null;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  detail?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: a.actorId ?? null,
        actorName: a.actorName,
        action: a.action,
        targetType: a.targetType ?? null,
        targetId: a.targetId ?? null,
        targetName: a.targetName ?? null,
        detail: a.detail ?? null,
      },
    });
  } catch {
    /* audit không bắt buộc */
  }
}
