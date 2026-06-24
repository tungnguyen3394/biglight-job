import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Stub } from "@/components/admin/Stub";

export default async function Page() {
  const user = (await getSessionUser())!;
  // hard gate: company / candidate cannot access commission management at all
  if (user.role === "COMPANY" || user.role === "CANDIDATE") redirect("/admin");
  return <Stub jp="報酬管理" en="Commission Management" note="GET /api/commissions は Company/Candidate に 403 を返します（CTV は自分の案件のみ）" />;
}
