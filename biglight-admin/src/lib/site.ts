// Cấu hình trang công khai (ứng viên). Đổi cho khớp BIGLIGHT thật.

// Trang/Messenger Facebook để ứng viên đăng ký & chat. ĐỔI THÀNH PAGE THẬT.
export const FB_PAGE_URL = "https://www.facebook.com/biglight";
export const FB_MESSENGER_URL = "https://m.me/biglight";

// Email nhận đơn ứng tuyển.
export const CONTACT_EMAIL = "info@biglight.jp";

// Ảnh bìa hero (đổi link nếu muốn ảnh riêng).
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80";

const INDUSTRY_IMG: Record<string, string> = {
  工業製品製造業: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=900&q=80",
  建設業: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=900&q=80",
  飲食料品製造業: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&q=80",
  外食業: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80",
  介護業: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=900&q=80",
  宿泊: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
  ビルクリーニング: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80",
  農業: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=900&q=80",
};
const FALLBACK_IMG = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80";

export function industryImage(industry: string): string {
  return INDUSTRY_IMG[industry] ?? FALLBACK_IMG;
}

export function manYen(yen?: number | null): number | null {
  return typeof yen === "number" ? Math.round(yen / 10000) : null;
}

export function salaryRange(min?: number | null, max?: number | null): string | null {
  const a = manYen(min);
  const b = manYen(max);
  if (a && b) return `${a}万〜${b}万円`;
  if (a) return `${a}万円〜`;
  if (b) return `〜${b}万円`;
  return null;
}

// Bộ tag chuẩn (14) — giống thiết kế gốc.
export const STANDARD_TAGS = [
  "寮あり", "個室寮", "未経験OK", "高収入", "駅近", "賞与あり", "土日休み",
  "日本語不問", "特定技能2号可", "送迎あり", "女性活躍", "長期歓迎", "残業少なめ", "家賃補助",
];
