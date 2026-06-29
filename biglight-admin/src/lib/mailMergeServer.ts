import { Prisma } from "@prisma/client";
import { snakeCase, type MergeField, type MergeScope } from "./mailMerge";

// Mail Merge — danh sách field LẤY TỰ ĐỘNG từ schema Prisma (DMMF).
// Thêm/sửa cột trong DB → tag tự cập nhật, KHÔNG cần sửa code.
const MODEL: Record<MergeScope, string> = { candidate: "Candidate", company: "Company" };

// Loại trừ cột nhạy cảm / nội bộ / không dùng để chèn mail.
const EXCLUDE = new Set([
  "id", "userId", "status", "updatedAt",
  "internalMemo", "consultNote", "contactHistory", "companyHistory", "riskNotes",
  "documents", "prefs", "savedJobIds", "passwordHash",
]);

// Nhãn JP cho field thường gặp (fallback = tên cột). Field mới chưa có nhãn → hiện tên cột.
const LABELS: Record<MergeScope, Record<string, string>> = {
  candidate: {
    name: "氏名", kana: "フリガナ", birthdate: "生年月日", nationality: "国籍", gender: "性別",
    phone: "電話番号", email: "メール", facebookUrl: "Facebook", currentAddress: "現在の住所",
    visaType: "在留資格", visaExpiryDate: "在留期限", currentTokuteiField: "特定技能分野",
    passedSkillTest: "技能試験合格", passedJlpt: "JLPT合格", canChangeJobFrom: "転職可能時期",
    japaneseLevel: "日本語レベル", desiredIndustry: "希望業種", desiredLocation: "希望勤務地",
    desiredSalary: "希望給与", canNightShift: "夜勤可", canShiftWork: "交替勤務可", canOvertime: "残業可",
    canRelocate: "転居可", wantDormitory: "寮希望", changeReason: "転職理由", createdAt: "登録日",
  },
  company: {
    name: "企業名", industry: "業種", address: "住所", contactName: "担当者名", phone: "電話番号",
    email: "メール", paymentInfo: "支払い情報", contractDetail: "契約内容", contractDate: "契約日",
    notes: "備考", createdAt: "登録日",
  },
};

export function getMergeFields(scope: MergeScope): MergeField[] {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === MODEL[scope]);
  if (!model) return [];
  return model.fields
    .filter((f) => f.kind === "scalar" && f.type !== "Json" && !EXCLUDE.has(f.name) && !f.name.endsWith("Id"))
    .map((f) => ({ col: f.name, tag: snakeCase(f.name), label: LABELS[scope][f.name] ?? f.name }));
}

// Định dạng 1 giá trị scalar → chuỗi để chèn mail.
export function fmtValue(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "boolean") return v ? "はい" : "いいえ";
  if (typeof v === "number") return String(v);
  return String(v);
}
