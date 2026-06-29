import { prisma } from "./prisma";
import { salaryRange } from "./site";

export const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
export const aiKeyConfigured = () => !!OPENAI_KEY;

// Cấu hình AI (singleton). Tự tạo nếu chưa có.
export async function getAiConfig() {
  const c = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  if (c) return c;
  return prisma.aiConfig.create({ data: { id: "default" } });
}

// System prompt cố định (cố vấn tuyển dụng BIGLIGHT). instructions của admin được ghép thêm.
const BASE_PROMPT = `Bạn là AI tư vấn tuyển dụng của BIGLIGHT JOB. Mục tiêu: giúp ứng viên tìm công việc特定技能 phù hợp nhất; trả lời nhanh, chính xác, thân thiện, ngắn gọn, lịch sự, không lan man, không dùng từ chuyên môn khó.

NGUYÊN TẮC BẮT BUỘC:
- CHỈ dùng dữ liệu求人 có trong "DANH SÁCH求人" bên dưới. TUYỆT ĐỐI không suy đoán, không bịa thông tin (lương/thưởng/tăng ca/visa/lịch phỏng vấn/thời gian xuất cảnh...).
- Nếu không có dữ liệu phù hợp, trả lời đúng: "Xin lỗi, hiện tại tôi chưa có thông tin đó. Nhân viên BIGLIGHT sẽ hỗ trợ bạn sớm nhất." (dịch sang ngôn ngữ của người dùng).
- Hỏi để hiểu nhu cầu trước khi đề xuất (đang ở Nhật hay nước ngoài, loại visa, khu vực muốn làm, ngành nghề, thời điểm muốn chuyển việc).
- Khi có nhiều đơn phù hợp: giới thiệu TỐI ĐA 5 đơn, ưu tiên: còn tuyển → hợp kỹ năng → gần khu vực mong muốn → lương cao → đăng mới. Không ép; đưa nhiều lựa chọn.
- KHÔNG hứa đậu phỏng vấn/visa, không hứa lương khác dữ liệu, không bịa thưởng/tăng ca/lịch/thời gian xuất cảnh.

NGÔN NGỮ: Trả lời ĐÚNG ngôn ngữ người dùng đang dùng (tiếng Việt→Việt, 日本語→日本語, English→English).

CHUYỂN NHÂN VIÊN: Nếu người dùng muốn đăng ký / đặt lịch phỏng vấn / gửi hồ sơ / gọi điện / khiếu nại, hoặc bạn không biết câu trả lời, hãy nói: "Tôi sẽ chuyển cuộc trò chuyện này cho nhân viên BIGLIGHT để hỗ trợ bạn tốt hơn." (dịch theo ngôn ngữ người dùng) và kết thúc câu trả lời bằng đúng token ở dòng cuối: <<HANDOFF>>`;

type J = { code: string; title: string; industry: string; jobTypeName: string | null; location: string; city: string | null; payType: string | null; baseSalary: number | null; salaryMin: number | null; salaryMax: number | null; expectedMonthly: number | null; japaneseLevel: string | null; residenceType: string | null; dormitoryAvailable: boolean; nightShift: boolean; recruitCount: number; tags: string[] };

// Danh sách求人 THẬT (còn公開 + OPEN). Chỉ trường có thật.
export async function buildJobContext(): Promise<string> {
  const jobs = (await prisma.job.findMany({
    where: { publicStatus: "PUBLIC", status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { code: true, title: true, industry: true, jobTypeName: true, location: true, city: true, payType: true, baseSalary: true, salaryMin: true, salaryMax: true, expectedMonthly: true, japaneseLevel: true, residenceType: true, dormitoryAvailable: true, nightShift: true, recruitCount: true, tags: true },
  })) as J[];
  if (!jobs.length) return "DANH SÁCH求人: (hiện không có求人 nào đang tuyển)";
  const lines = jobs.map((j) => {
    const sal = j.payType && j.baseSalary ? `${j.payType} ¥${j.baseSalary.toLocaleString("ja-JP")}` : salaryRange(j.salaryMin, j.salaryMax);
    const monthly = j.expectedMonthly ? ` / 月収例¥${j.expectedMonthly.toLocaleString("ja-JP")}` : "";
    const extra = [j.dormitoryAvailable ? "寮あり" : "", j.nightShift ? "夜勤あり" : "", j.japaneseLevel ? `日本語${j.japaneseLevel}` : "", j.residenceType ? `在留:${j.residenceType}` : "", (j.tags || []).join("・")].filter(Boolean).join(" / ");
    return `- [${j.code}] ${j.title}｜分野:${j.industry}${j.jobTypeName ? `/職種:${j.jobTypeName}` : ""}｜勤務地:${j.location}${j.city ? " " + j.city : ""}｜給与:${sal}${monthly}｜募集${j.recruitCount}名｜${extra}`;
  });
  return "DANH SÁCH求人 (chỉ được dùng đúng những đơn này):\n" + lines.join("\n");
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

// Gọi OpenAI → trả lời. handoff=true nếu AI yêu cầu chuyển nhân viên.
export async function aiReply(history: ChatTurn[], instructions: string, model: string): Promise<{ text: string; handoff: boolean } | null> {
  if (!OPENAI_KEY) return null;
  const jobCtx = await buildJobContext();
  const system = [BASE_PROMPT, instructions?.trim() ? `\nHƯỚNG DẪN BỔ SUNG (admin huấn luyện):\n${instructions.trim()}` : "", `\n${jobCtx}`].join("\n");
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: model || "gpt-4o-mini", temperature: 0.3, max_tokens: 700, messages: [{ role: "system", content: system }, ...history.slice(-12)] }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    let text: string = j?.choices?.[0]?.message?.content?.trim?.() || "";
    if (!text) return null;
    const handoff = /<<HANDOFF>>/i.test(text);
    text = text.replace(/<<HANDOFF>>/gi, "").trim();
    return { text, handoff };
  } catch { return null; }
}
