import { getSessionUser } from "@/lib/auth";
import { Stub } from "@/components/admin/Stub";
import { Forbidden } from "@/components/admin/Forbidden";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || user.role === "CANDIDATE") return <Forbidden />;
  return <Stub jp="メッセージ" en="Messages" note="応募者とのチャット（近日対応）" />;
}
