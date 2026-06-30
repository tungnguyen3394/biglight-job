// Client helper: gọi API xóa thống nhất (đơn lẻ/hàng loạt) cho các bảng admin.
export type DelEntity = "job" | "candidate" | "article" | "application" | "company";

export async function requestDelete(entity: DelEntity, ids: string[]): Promise<{ ok: boolean; error?: string; count?: number }> {
  const r = await fetch("/api/admin/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity, ids }),
  });
  const j = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, count: j.count } : { ok: false, error: j.error || "削除に失敗しました。" };
}
