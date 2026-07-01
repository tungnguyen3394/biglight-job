// Helper cho 履歴書PDF (sơ yếu lý lịch) — dùng chung cho form (live), dashboard và route PDF.

export type WorkRow = { start?: string; end?: string; company?: string; work?: string; current?: boolean };

// Điều kiện được xuất PDF: 住所(都道府県+詳細) + ít nhất 1 職歴 đủ(入社年月/会社名/業務内容) + 証明写真.
export function pdfEligibility(p: {
  address?: string | null;
  addressDetail?: string | null;
  workHistory?: WorkRow[] | null;
  hasPhoto?: boolean;
}): { addressOk: boolean; workOk: boolean; photoOk: boolean; ok: boolean } {
  const addressOk = !!p.address?.trim() && !!p.addressDetail?.trim();
  const workOk = !!(p.workHistory ?? []).some((w) => w?.start?.trim() && w?.company?.trim() && w?.work?.trim());
  const photoOk = !!p.hasPhoto;
  return { addressOk, workOk, photoOk, ok: addressOk && workOk && photoOk };
}

// "2022-04" → "2022年4月"; "2022" → "2022年"; rỗng → "".
export function formatYm(s?: string | null): string {
  if (!s) return "";
  const [y, m] = String(s).split("-");
  if (!y) return "";
  return m ? `${y}年${Number(m)}月` : `${y}年`;
}

// Hiển thị 退職: đang làm→「現在まで」, có ngày→ngày, trống→「未記入」.
export function workEndLabel(w: WorkRow): string {
  if (w.current) return "現在まで";
  return w.end ? formatYm(w.end) : "未記入";
}

export const PDF_WARN = "履歴書PDFを出力するには、住所・職務経歴・証明写真の入力が必要です。";
export const PDF_READY_TOAST = "履歴書PDFを出力できるようになりました";
