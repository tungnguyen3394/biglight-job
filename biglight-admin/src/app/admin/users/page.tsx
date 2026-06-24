import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { Stub } from "@/components/admin/Stub";

export default async function Page() {
  const user = (await getSessionUser())!;
  if (!canManageUsers(user.role)) redirect("/admin");
  return <Stub jp="ユーザー管理" en="User Management" note="ユーザー作成・ロール変更・ロック・パスワードリセット（Super Admin のみ）" />;
}
