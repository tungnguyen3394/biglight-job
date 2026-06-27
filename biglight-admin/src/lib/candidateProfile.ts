// Kiểm tra hồ sơ ứng viên đã đủ trường BẮT BUỘC để được 応募 chưa.
// Bắt buộc: お名前 / 生年月日 / 性別 / 国籍 / 現在の在留資格 / SNSアカウント (+ email)
// (電話番号 đã chuyển thành 任意; SNSアカウント chuyển thành 必須)

type CandidateLike = {
  name: string | null;
  birthdate: Date | null;
  nationality: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  visaType: string | null;
  facebookUrl?: string | null;
  prefs?: unknown;
};
type UserLike = { email: string } | null | undefined;

function hasSns(c: CandidateLike): boolean {
  const p = (c.prefs as Record<string, unknown>) || {};
  const ok = (v: unknown) => typeof v === "string" && v.trim() !== "";
  return ok(c.facebookUrl) || ok(p.instagramUrl) || ok(p.tiktokUrl);
}

// Email coi như đã có nếu: candidate.email có giá trị, HOẶC tài khoản login có email thật
// (không phải email tổng hợp dạng *.biglight.local của Facebook không trả email / Google nội bộ).
export function hasUsableEmail(candidate: { email: string | null }, user: UserLike): boolean {
  if (candidate.email && candidate.email.trim()) return true;
  if (user && user.email && !user.email.endsWith(".biglight.local")) return true;
  return false;
}

export function profileMissing(candidate: CandidateLike, user: UserLike): string[] {
  const miss: string[] = [];
  if (!candidate.name || !candidate.name.trim()) miss.push("お名前");
  if (!candidate.birthdate) miss.push("生年月日");
  if (candidate.gender !== "MALE" && candidate.gender !== "FEMALE") miss.push("性別");
  if (!candidate.nationality || !candidate.nationality.trim()) miss.push("国籍");
  if (!candidate.visaType || !candidate.visaType.trim()) miss.push("現在の在留資格");
  if (!hasSns(candidate)) miss.push("SNSアカウント");
  if (!hasUsableEmail(candidate, user)) miss.push("メールアドレス");
  return miss;
}

export function isProfileComplete(candidate: CandidateLike, user: UserLike): boolean {
  return profileMissing(candidate, user).length === 0;
}
