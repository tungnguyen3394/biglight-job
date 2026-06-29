// Mail Merge — helper THUẦN (dùng được cả client lẫn server).
export type MergeScope = "candidate" | "company";
export type MergeField = { tag: string; label: string; col: string };
export type MergeRecipient = { id: string; name: string; email: string; values: Record<string, string> };

export const snakeCase = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toLowerCase();

// Thay {{tag}} bằng giá trị. Trống → "" (blank) hoặc "未入力" (placeholder).
export function renderTemplate(text: string, tagValues: Record<string, string>, emptyMode: "blank" | "placeholder"): string {
  return (text || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, tag: string) => {
    const v = tagValues[tag.toLowerCase()];
    if (v == null || v === "") return emptyMode === "placeholder" ? "未入力" : "";
    return v;
  });
}

// Map tag→value cho 1 người nhận (theo danh sách field).
export function tagValuesFor(fields: MergeField[], r: MergeRecipient): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) out[f.tag] = r.values[f.col] ?? "";
  return out;
}
