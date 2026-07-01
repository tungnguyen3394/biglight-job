import { getSessionUser } from "@/lib/auth";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import OptionsManager from "@/components/admin/OptionsManager";
import AiSettings from "@/components/admin/AiSettings";
import AiKnowledge from "@/components/admin/AiKnowledge";
import Collapsible from "@/components/admin/Collapsible";

export const dynamic = "force-dynamic";

const ICONS = {
  ai: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3 3 3 0 0 1 0 6 3 3 0 0 1-3 3v1a3 3 0 0 1-6 0v-1a3 3 0 0 1-3-3 3 3 0 0 1 0-6 3 3 0 0 1 3-3V5a3 3 0 0 1 3-3z" /><path d="M9 12h.01M15 12h.01" /></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" /></svg>,
  master: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>,
  other: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
};

export default async function Page() {
  const user = await getSessionUser();
  if (!user || effectiveAdminLevel(user) !== "ADMIN") return <Forbidden />;
  return (
    <div className="space-y-4">
      <Collapsible id="ai" title="AI設定（自動返信）" icon={ICONS.ai}><AiSettings /></Collapsible>
      <Collapsible id="knowledge" title="AI Knowledge" icon={ICONS.book}><AiKnowledge /></Collapsible>
      <Collapsible id="master" title="定義マスタ" icon={ICONS.master}><OptionsManager /></Collapsible>
      <Collapsible id="other" title="その他設定" icon={ICONS.other} defaultOpen={false}>
        <p className="text-sm text-slate-400">今後、その他の設定項目をここに追加します。</p>
      </Collapsible>
    </div>
  );
}
