import { prisma } from "./prisma";
import { logAudit } from "./audit";
import { notify } from "./notify";

const LABEL: Record<string, string> = { job: "求人", candidate: "応募者", article: "記事", application: "応募" };

// Ghi 操作ログ + gửi thông báo cho TẤT CẢ admin mỗi khi có xóa dữ liệu.
export async function reportDelete(
  actor: { id: string; name: string },
  entity: "job" | "candidate" | "article" | "application",
  names: string[],
) {
  const label = LABEL[entity] ?? entity;
  const preview = names.filter(Boolean).slice(0, 5).join("、");
  await logAudit({
    actorId: actor.id, actorName: actor.name,
    action: `${entity}.delete`, targetType: entity,
    targetName: preview.slice(0, 200) || `${names.length}件`,
    detail: `${label} を ${names.length}件 削除${names.length > 5 ? "（先頭5件を表示）" : ""}`,
  });
  // thông báo cho mọi tài khoản cấp Admin
  const admins = await prisma.user.findMany({
    where: { OR: [{ adminRole: "ADMIN" }, { role: { in: ["SUPER_ADMIN", "MANAGER"] } }] },
    select: { id: true },
  });
  await Promise.all(admins.map((a) => notify(a.id, {
    type: "status",
    title: "データ削除の通知",
    body: `${actor.name} が ${label} を ${names.length}件 削除しました${preview ? `：${preview}` : ""}`.slice(0, 180),
    link: "/admin/users",
  })));
}
