import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import OptionsManager from "@/components/admin/OptionsManager";
import AiSettings from "@/components/admin/AiSettings";
import AiKnowledge from "@/components/admin/AiKnowledge";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || effectiveAdminLevel(user) !== "ADMIN") return <Forbidden />;
  return (
    <div className="space-y-5">
      <AiSettings />
      <AiKnowledge />
      <OptionsManager />
    </div>
  );
}
