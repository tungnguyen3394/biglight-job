// Tiện ích nhận diện in-app browser (webview Facebook/Zalo/Instagram/Line...) và
// mở URL bằng trình duyệt ngoài (Chrome/Safari) — vì Google CHẶN OAuth trong webview.

export function isInAppBrowser(ua?: string): boolean {
  const s = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!s) return false;
  const apps = /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line\/|NAVER|Zalo|MicroMessenger|KAKAOTALK|TikTok|musical_ly|Snapchat|Twitter|GSA/i;
  const androidWv = /Android.*;\s*wv\)/i; // Android WebView
  return apps.test(s) || androidWv.test(s);
}

export function osOf(ua?: string): "android" | "ios" | "other" {
  const s = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (/android/i.test(s)) return "android";
  if (/iphone|ipad|ipod/i.test(s)) return "ios";
  return "other";
}

// Mở URL bằng trình duyệt thật. Android: intent→Chrome. iOS: scheme Chrome (nếu có).
export function openExternalBrowser(url: string): void {
  if (typeof window === "undefined") return;
  const os = osOf();
  if (os === "android") {
    const noScheme = url.replace(/^https?:\/\//, "");
    window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
  } else if (os === "ios") {
    // googlechromes:// mở Chrome iOS nếu cài; nếu không, người dùng dùng nút "ブラウザで開く" thủ công
    window.location.href = url.replace(/^https:\/\//, "googlechromes://").replace(/^http:\/\//, "googlechrome://");
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
