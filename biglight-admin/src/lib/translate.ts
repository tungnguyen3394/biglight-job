// Dịch tự động — tách riêng để sau này thay DeepL / Google Translate / OpenAI.
// MVP: mock (trả nguyên văn khi chưa có API). Data model đã sẵn sàng.

export type Lang = "ja" | "vi" | "en";

const JP = /[぀-ヿ㐀-䶿一-龯ｦ-ﾟ]/; // hira/kata/kanji
const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

// Phát hiện ngôn ngữ thô từ nội dung.
export function detectLang(text: string): Lang {
  if (JP.test(text)) return "ja";
  if (VI.test(text)) return "vi";
  return "en";
}

// Dịch text sang `target`. Trả về nguyên văn nếu cùng ngôn ngữ hoặc chưa có API.
// TODO: tích hợp provider thật tại đây (đọc process.env.TRANSLATE_API_KEY ...).
export async function translate(text: string, target: Lang, source?: Lang): Promise<string> {
  const src = source ?? detectLang(text);
  if (!text.trim() || src === target) return text;
  // --- MVP mock: chưa gọi API → giữ nguyên văn ---
  return text;
}
