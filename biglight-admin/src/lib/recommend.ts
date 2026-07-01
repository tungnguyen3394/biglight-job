// おすすめ度 — TÍNH THẬT từ hồ sơ ứng viên ↔ điều kiện đơn (rule-based, không AI).
// Trọng số: 分野25 / 勤務地20 / 日本語20 / 給与15 / 性別10 / 国籍10. Trường trống = 0 điểm. Đơn không ghi điều kiện = hợp.
export type Factor = { key: string; label: string; ok: boolean; note: string };
export type Recommend = { score: number; stars: number; summary: string; factors: Factor[] };

export type CandProfile = {
  desiredSalary?: number | null;   // 希望給与
  desiredLocation?: string | null; // 希望勤務地 (danh sách tỉnh, phân tách , 、 space)
  gender?: string | null;          // MALE / FEMALE / ANY
  nationality?: string | null;     // 国籍
  japaneseLevel?: string | null;   // 不問 / N5..N1
  desiredIndustry?: string | null; // 希望分野 (danh sách 分野)
};
export type JobCond = {
  industry: string;
  location: string;
  genderCondition?: string | null;     // ANY / MALE / FEMALE
  nationalityCondition?: string | null;
  nationalityText?: string | null;     // title + description + tags (fallback dò quốc tịch)
  japaneseLevel?: string | null;
  monthly?: number | null;             // 想定月収 ?? 最低給与
};

const W = { industry: 25, location: 20, japanese: 20, salary: 15, gender: 10, nationality: 10 };
const JP_RANK: Record<string, number> = { "不問": 0, "N5": 1, "N4": 2, "N3": 3, "N2": 4, "N1": 5 };
const NAT_KEYS = ["ベトナム", "インドネシア", "ミャンマー", "フィリピン", "ネパール", "中国", "カンボジア", "スリランカ", "バングラデシュ", "タイ", "モンゴル"];

const norm = (s?: string | null) => (s ?? "").trim();
const splitList = (s?: string | null) => norm(s).split(/[,、\s/]+/).map((x) => x.trim()).filter(Boolean);
const yen = (n?: number | null) => { const v = n ?? 0; return v > 0 && v < 1000 ? v * 10000 : v; }; // 19(万) → 190000

export function computeMatch(c: CandProfile | null, j: JobCond): Recommend {
  const factors: Factor[] = [];
  let got = 0;
  const add = (key: string, label: string, weight: number, ok: boolean, note: string) => {
    factors.push({ key, label, ok, note });
    if (ok) got += weight;
  };

  // 特定技能分野
  {
    const list = splitList(c?.desiredIndustry);
    const ok = list.length > 0 && list.some((x) => x === j.industry || x.includes(j.industry) || j.industry.includes(x));
    add("industry", "特定技能分野", W.industry, ok, list.length === 0 ? "希望分野が未入力" : ok ? `分野が一致（${j.industry}）` : "希望分野と異なる");
  }
  // 勤務地
  {
    const list = splitList(c?.desiredLocation);
    const ok = list.length > 0 && list.some((x) => x === j.location || x.includes(j.location) || j.location.includes(x));
    add("location", "勤務地", W.location, ok, list.length === 0 ? "希望勤務地が未入力" : ok ? `勤務地が一致（${j.location}）` : "希望勤務地と異なる");
  }
  // 日本語
  {
    const cand = norm(c?.japaneseLevel);
    const req = norm(j.japaneseLevel);
    const ok = !!cand && (JP_RANK[cand] ?? 0) >= (JP_RANK[req] ?? 0);
    add("japanese", "日本語", W.japanese, ok, !cand ? "日本語レベルが未入力" : ok ? "日本語レベルが条件を満たす" : `日本語がやや不足（要:${req || "不問"}）`);
  }
  // 希望給与
  {
    const want = yen(c?.desiredSalary);
    const pay = yen(j.monthly);
    const ok = want > 0 && pay > 0 && pay >= want;
    add("salary", "希望給与", W.salary, ok, want === 0 ? "希望給与が未入力" : pay === 0 ? "求人の給与情報なし" : ok ? "給与が希望を満たす" : "給与が希望をやや下回る");
  }
  // 性別
  {
    const g = norm(c?.gender);
    const cond = norm(j.genderCondition) || "ANY";
    const has = g === "MALE" || g === "FEMALE";
    const ok = cond === "ANY" || (has && cond === g);
    add("gender", "性別", W.gender, ok, cond === "ANY" ? "性別条件なし（対象）" : !has ? "性別が未入力" : ok ? "性別条件に合致" : "性別条件が異なる");
  }
  // 国籍
  {
    const nat = norm(c?.nationality);
    const cond = `${norm(j.nationalityCondition)} ${norm(j.nationalityText)}`;
    const specified = NAT_KEYS.some((k) => cond.includes(k));
    const ok = !specified || (!!nat && NAT_KEYS.some((k) => cond.includes(k) && (nat.includes(k) || k.includes(nat))));
    add("nationality", "国籍", W.nationality, ok, !specified ? "国籍条件なし（対象）" : !nat ? "国籍が未入力" : ok ? "国籍が対象に含まれる" : "国籍が対象外の可能性");
  }

  const score = Math.max(0, Math.min(100, Math.round(got)));
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
  const summary = score >= 85 ? "あなたのプロフィールにとても合う求人です"
    : score >= 65 ? "あなたのプロフィールに合う求人です"
    : score >= 45 ? "条件を補うと、より合う求人になります"
    : "プロフィールを充実させると精度が上がります";
  return { score, stars, summary, factors };
}
