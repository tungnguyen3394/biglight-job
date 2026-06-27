// Dịch tự động giữa tiếng Việt / Indonesia / Anh ↔ Nhật.
// Dùng endpoint công khai của Google (không cần API key). Lỗi/timeout → trả nguyên văn.
// Có thể thay bằng DeepL/OpenAI sau bằng cách sửa hàm translate().

export type Lang = "ja" | "vi" | "id" | "en";

const JP = /[぀-ヿ㐀-䶿一-龯ｦ-ﾟ]/; // hira/kata/kanji
const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const ID = /\b(saya|kamu|anda|dan|yang|tidak|untuk|dengan|ini|itu|terima kasih|apa|bisa|sudah|akan|kerja|gaji|adalah|mau|saja|juga)\b/i;

// Phát hiện ngôn ngữ thô từ nội dung (để lưu nhãn originalLanguage).
export function detectLang(text: string): Lang {
  if (JP.test(text)) return "ja";
  if (VI.test(text)) return "vi";
  if (ID.test(text)) return "id";
  return "en";
}

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";

// Dịch `text` sang `target`. Trả nguyên văn nếu cùng ngôn ngữ, rỗng, hoặc khi gọi API lỗi.
export async function translate(text: string, target: Lang, source?: Lang): Promise<string> {
  const src = source ?? detectLang(text);
  if (!text.trim() || src === target) return text;
  try {
    const url = `${ENDPOINT}?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return text;
    const data = await res.json();
    // data[0] = [[ "đã dịch", "nguyên văn", ... ], ...]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const out = data[0].map((seg: unknown) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : "")).join("");
      return out.trim() || text;
    }
    return text;
  } catch {
    return text;
  }
}
