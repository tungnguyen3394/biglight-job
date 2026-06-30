import { prisma } from "./prisma";
import { salaryRange, PUBLIC_BASE_URL } from "./site";
import { DEFAULT_AI_PROMPT, AI_TECH_NOTE } from "./aiPrompt";

export const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
export const aiKeyConfigured = () => !!OPENAI_KEY;

// Cấu hình AI (singleton). Tự tạo nếu chưa có.
export async function getAiConfig() {
  const c = await prisma.aiConfig.findUnique({ where: { id: "default" } });
  if (c) return c;
  return prisma.aiConfig.create({ data: { id: "default" } });
}

type J = { id: string; code: string; title: string; industry: string; jobTypeName: string | null; location: string; city: string | null; payType: string | null; baseSalary: number | null; salaryMin: number | null; salaryMax: number | null; expectedMonthly: number | null; japaneseLevel: string | null; residenceType: string | null; dormitoryAvailable: boolean; nightShift: boolean; recruitCount: number; tags: string[] };

// Danh sách求人 THẬT (còn公開 + OPEN). Chỉ trường có thật. Mỗi đơn kèm URL thật để AI dán link (không bịa).
export async function buildJobContext(): Promise<string> {
  const jobs = (await prisma.job.findMany({
    where: { publicStatus: "PUBLIC", status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { id: true, code: true, title: true, industry: true, jobTypeName: true, location: true, city: true, payType: true, baseSalary: true, salaryMin: true, salaryMax: true, expectedMonthly: true, japaneseLevel: true, residenceType: true, dormitoryAvailable: true, nightShift: true, recruitCount: true, tags: true },
  })) as J[];
  if (!jobs.length) return "DANH SÁCH求人: (hiện không có求人 nào đang tuyển)";
  const lines = jobs.map((j) => {
    const sal = j.payType && j.baseSalary ? `${j.payType} ¥${j.baseSalary.toLocaleString("ja-JP")}` : salaryRange(j.salaryMin, j.salaryMax);
    const monthly = j.expectedMonthly ? ` / 月収例¥${j.expectedMonthly.toLocaleString("ja-JP")}` : "";
    const extra = [j.dormitoryAvailable ? "寮あり" : "", j.nightShift ? "夜勤あり" : "", j.japaneseLevel ? `日本語${j.japaneseLevel}` : "", j.residenceType ? `在留:${j.residenceType}` : "", (j.tags || []).join("・")].filter(Boolean).join(" / ");
    const url = `${PUBLIC_BASE_URL}/jobs/${j.id}`;
    return `- [${j.code}] ${j.title}｜分野:${j.industry}${j.jobTypeName ? `/職種:${j.jobTypeName}` : ""}｜勤務地:${j.location}${j.city ? " " + j.city : ""}｜給与:${sal}${monthly}｜募集${j.recruitCount}名｜${extra}｜応募/詳細: ${url}`;
  });
  return "DANH SÁCH求人 (chỉ được dùng đúng những đơn này):\n" + lines.join("\n");
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

// Gọi OpenAI → trả lời. handoff=true nếu AI yêu cầu chuyển nhân viên.
export async function aiReply(history: ChatTurn[], instructions: string, model: string): Promise<{ text: string; handoff: boolean } | null> {
  if (!OPENAI_KEY) return null;
  const jobCtx = await buildJobContext();
  // Chỉ dẫn = ô AI設定 (admin tự sửa); nếu trống → dùng mẫu gợi ý. Code chỉ ghép ràng buộc kỹ thuật + dữ liệu求人.
  const persona = instructions?.trim() || DEFAULT_AI_PROMPT;
  const system = `${persona}\n\n${AI_TECH_NOTE}\n\n${jobCtx}`;
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
