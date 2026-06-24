// Cấu hình trang công khai (ứng viên). Đổi các giá trị ở đây cho khớp BIGLIGHT thật.

// Trang/Messenger Facebook để ứng viên đăng ký & chat. ĐỔI THÀNH PAGE THẬT của bạn.
export const FB_PAGE_URL = "https://www.facebook.com/biglight";
export const FB_MESSENGER_URL = "https://m.me/biglight";

// Email nhận đơn ứng tuyển (nút "応募・お問い合わせ").
export const CONTACT_EMAIL = "info@biglight.jp";

// Ảnh bìa hero trang chủ (đổi link nếu muốn ảnh riêng).
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80";

// Ảnh minh hoạ theo ngành (業種) cho thẻ việc làm + hero chi tiết.
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

// Yên → đơn vị 万 (làm tròn). 230000 -> 23
export function manYen(yen?: number | null): number | null {
  return typeof yen === "number" ? Math.round(yen / 10000) : null;
}

// Hiển thị khoảng lương "23万〜30万円"
export function salaryRange(min?: number | null, max?: number | null): string | null {
  const a = manYen(min);
  const b = manYen(max);
  if (a && b) return `${a}万〜${b}万円`;
  if (a) return `${a}万円〜`;
  if (b) return `〜${b}万円`;
  return null;
}
