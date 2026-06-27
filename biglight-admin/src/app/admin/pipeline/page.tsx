import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel, adminCan } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import PipelineSplit from "@/components/admin/PipelineSplit";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  const level = user ? effectiveAdminLevel(user) : null;
  if (!user || !level || !adminCan(level, "applicants.read")) return <Forbidden />;
  // Admin/Staff: sửa được; View: chỉ xem.
  const canEdit = adminCan(level, "applicants.update");
  return <PipelineSplit canEdit={canEdit} />;
}
