import { getSessionUser, isAllowedAdminEmail } from "@/lib/auth";
import { effectiveAdminLevel, adminCan } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import MessagesAdmin from "@/components/admin/MessagesAdmin";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  const level = user ? effectiveAdminLevel(user) : null;
  if (!user || !level || !adminCan(level, "messages.read")) return <Forbidden />;

  // Chỉ @biglight.jp + có quyền reply mới được trả lời / xóa / thu hồi.
  const internal = isAllowedAdminEmail(user.email);
  const canReply = adminCan(level, "messages.reply") && internal;
  const canManage = canReply; // 会話削除 / 削除 / 取り消し: Admin + Staff
  const isAdmin = level === "ADMIN";
  return <MessagesAdmin canReply={canReply} canManage={canManage} isAdmin={isAdmin} myId={user.id} />;
}
