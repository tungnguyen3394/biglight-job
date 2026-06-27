// Quản lý đồng ý Cookie/Privacy Policy (client-side, lưu bằng cookie thường).

export const CONSENT_COOKIE = "biglight_cookie_policy_agreed";
// Event để các nút login yêu cầu mở popup khi user chưa đồng ý.
export const CONSENT_OPEN_EVENT = "biglight:open-cookie-consent";

export function hasCookieConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${CONSENT_COOKIE}=true`);
}

export function setCookieConsent(): void {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  // max-age 1 năm, path /, SameSite=Lax, Secure nếu HTTPS
  document.cookie = `${CONSENT_COOKIE}=true; max-age=31536000; path=/; SameSite=Lax${secure}`;
}

// Mở popup đồng ý (gọi từ nút login khi chưa đồng ý).
export function requestCookieConsent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
