// おすすめスコア — điểm gợi ý nhanh per求人 (KHÔNG phải chatbot, tách biệt với AI chat).
// ⚠ MOCK / DUMMY frontend — CHƯA nối API/DB. Deterministic theo jobId để điểm ổn định.
export type Recommend = {
  score: number; stars: number; summary: string;
  reasons: string[]; missing: string[]; suggestions: string[];
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const REASONS = [
  "希望勤務地と一致しています",
  "特定技能分野が募集条件に合っています",
  "日本語レベルが条件を満たしています",
  "寮あり・生活サポートが希望に合います",
  "未経験から始められる求人です",
  "希望の給与レンジに近い条件です",
];
const MISSING = [
  "希望給与が未入力です",
  "日本語資格の登録が未完了です",
  "希望業種が未設定です",
  "保有スキルの記入がありません",
];
const SUGGEST = [
  "プロフィールの「希望条件」を入力すると精度が上がります",
  "資格・スキルを追加しましょう",
  "希望勤務地を登録するとおすすめが増えます",
];

function pick<T>(arr: T[], seed: number, n: number): T[] {
  const pool = [...arr]; const out: T[] = []; let s = seed >>> 0;
  for (let i = 0; i < n && pool.length; i++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; out.push(pool.splice(s % pool.length, 1)[0]); }
  return out;
}

export function recommendScore(jobId: string): Recommend {
  const h = hash(jobId);
  const score = 72 + (h % 27); // 72–98
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
  const summary = score >= 88 ? "あなたのプロフィールはこの求人にとても合っています"
    : score >= 80 ? "あなたのプロフィールはこの求人にかなり合っています"
    : "条件を少し補うと、より合う求人です";
  const reasons = pick(REASONS, h, score >= 85 ? 3 : 2);
  const missing = score >= 92 ? [] : pick(MISSING, h >> 3, score >= 82 ? 1 : 2);
  const suggestions = missing.length ? pick(SUGGEST, h >> 5, 1) : [];
  return { score, stars, summary, reasons, missing, suggestions };
}
