// Cấu hình trang công khai (ứng viên). Đổi cho khớp BIGLIGHT thật.

// Trang/Messenger Facebook để ứng viên đăng ký & chat. ĐỔI THÀNH PAGE THẬT.
export const FB_PAGE_URL = "https://www.facebook.com/biglight";
export const FB_MESSENGER_URL = "https://m.me/biglight";

// Email nhận đơn ứng tuyển.
export const CONTACT_EMAIL = "info@biglight.jp";

// Base URL công khai (dùng cho OAuth redirect của Facebook). Đổi nếu domain khác.
export const PUBLIC_BASE_URL = "https://job.biglight.jp";

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

// Người tư vấn (SUPPORT TEAM) — sửa tên/ảnh/ngôn ngữ cho đúng nhân sự thật.
export const TEAM = [
  { name: "グェン・ホア", rom: "Nguyen Hoa", role: "製造分野 担当", langs: ["🇻🇳 Tiếng Việt", "🇯🇵 日本語"], img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&q=80", fb: "https://i.pravatar.cc/400?img=47" },
  { name: "佐藤 健一", rom: "Sato Kenichi", role: "建設分野 担当", langs: ["🇯🇵 日本語", "🇬🇧 English"], img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80", fb: "https://i.pravatar.cc/400?img=12" },
  { name: "レ・ティ・マイ", rom: "Le Thi Mai", role: "ビザ・書類 担当", langs: ["🇻🇳 Tiếng Việt", "🇯🇵 日本語"], img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80", fb: "https://i.pravatar.cc/400?img=45" },
  { name: "田中 さくら", rom: "Tanaka Sakura", role: "生活サポート 担当", langs: ["🇯🇵 日本語", "🇻🇳 Tiếng Việt"], img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&q=80", fb: "https://i.pravatar.cc/400?img=33" },
];

// Câu chuyện thành công (SUCCESS STORIES).
export const STORIES = [
  { name: "Tran V. ・26歳", meta: "工業製品製造業 / 愛知県", img: "https://i.pravatar.cc/100?img=33", quote: "日本語が不安でしたが、面接の準備まで手伝ってくれました。今は寮から通って安定して働けています。" },
  { name: "Le T. ・24歳", meta: "飲食料品製造業 / 岐阜県", img: "https://i.pravatar.cc/100?img=45", quote: "手数料が無料で本当に助かりました。女性専用寮もあり、安心して働けています。" },
  { name: "Pham H. ・28歳", meta: "建設業 / 岐阜県", img: "https://i.pravatar.cc/100?img=52", quote: "実習生から特定技能へ。給料も上がり、家族に仕送りもできるようになりました。" },
];

// Thông tin công ty (footer).
export const COMPANY = {
  name: "BIGLIGHT株式会社",
  postal: "〒462-0007",
  address: "愛知県名古屋市北区如意一丁目112 A",
  tel: "052-908-7944",
  licenses: ["有料職業紹介 23-ユ-302414", "登録支援機関 21登-006596"],
};
