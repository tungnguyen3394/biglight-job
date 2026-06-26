import { Badge, publicStatusTone } from "@/components/ui/Badge";
import { PUBLIC_STATUS_LABEL } from "@/lib/constants";

// Badge cho 公開ステータス
export function JobStatusBadge({ status }: { status: string }) {
  return <Badge tone={publicStatusTone(status) as never}>{PUBLIC_STATUS_LABEL[status] ?? status}</Badge>;
}

// Badge có/không cho 寮・夜勤・シフト
export function BoolBadge({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>{label}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">—</span>
  );
}
