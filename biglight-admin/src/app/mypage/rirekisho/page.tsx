import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PrintBar from "@/components/candidate/PrintBar";
import { pdfEligibility, formatYm, workEndLabel, PDF_WARN, type WorkRow } from "@/lib/rirekisho";

export const dynamic = "force-dynamic";

const ymd = (d?: Date | null) => (d ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` : "未記入");
const ymdStr = (s?: string | null) => { if (!s) return "未記入"; const [y, m, d] = String(s).split("-"); return y ? `${y}年${Number(m || 1)}月${d ? `${Number(d)}日` : ""}` : "未記入"; };
const genderJP = (g?: string | null) => (g === "MALE" ? "男性" : g === "FEMALE" ? "女性" : "未記入");
const v = (s?: string | null) => (s && String(s).trim() ? String(s) : "未記入");

const DOCLIST = [
  { id: "rirekisho", label: "履歴書" },
  { id: "zairyu", label: "在留カード（両面）" },
  { id: "hyouka", label: "専門級 / 評価調書" },
  { id: "jlpt", label: "日本語能力試験（JLPT）" },
  { id: "tokutei", label: "特定技能の資格" },
];

export default async function RirekishoPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") redirect("/mypage");

  const c = await prisma.candidate.findUnique({ where: { userId: session.id }, include: { user: true } });
  if (!c) redirect("/mypage");

  const p = (c.prefs as Record<string, unknown>) || {};
  const docs = (c.documents as Record<string, { name: string; file: string }[]>) || {};
  const workHistory: WorkRow[] = Array.isArray(p.workHistory) ? (p.workHistory as WorkRow[]) : [];
  const addressDetail = (p.addressDetail as string) || "";
  const cvPhoto = docs.cvphoto?.[0]?.file;

  // Gating server-side: thiếu thì hiện cảnh báo, không xuất.
  const elig = pdfEligibility({ address: c.currentAddress, addressDetail, workHistory, hasPhoto: !!cvPhoto });
  if (!elig.ok) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="text-base font-bold text-ink">{PDF_WARN}</p>
        <Link href="/mypage?sec=profile" className="mt-5 inline-block rounded-xl bg-bl-red px-6 py-3 text-sm font-bold text-white">プロフィール入力へ</Link>
      </div>
    );
  }

  const email = c.user?.email && !c.user.email.endsWith(".biglight.local") ? c.user.email : c.email;
  const industries = c.desiredIndustry ? c.desiredIndustry.split(",").filter(Boolean).join("、") : "";
  const locations = c.desiredLocation ? c.desiredLocation.split(",").filter(Boolean).join("、") : "";
  const salary = c.desiredSalary ? `${Math.round(c.desiredSalary / 10000)}万円` : "";
  const priorities = Array.isArray(p.priorities) ? (p.priorities as string[]).join("、") : "";

  const wishRows: [string, string][] = [
    ["希望分野", v(industries)],
    ["希望勤務地", v(locations)],
    ["希望月給（手取り）", v(salary)],
    ["希望職種", v(p.desiredJobType as string)],
    ["寮の希望", v(p.dorm as string)],
    ["就業可能時期", v(p.start as string)],
    ["夜勤", v(p.nightshift as string)],
    ["交替勤務", v(p.shiftwork as string)],
    ["重視すること", v(priorities)],
  ];

  return (
    <div className="min-h-screen bg-[#e9edf1] text-ink">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; width: auto !important; }
        }
        .rk-sec { break-inside: avoid; }
        .rk-work { break-inside: avoid; }
      `}</style>

      <PrintBar />

      <div className="sheet mx-auto my-6 w-[210mm] max-w-[calc(100vw-24px)] bg-white p-[14mm] shadow-xl print:my-0 print:w-auto print:p-0">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4 border-b-2 border-ink pb-3">
          <div>
            <h1 className="text-2xl font-black tracking-wide text-ink">履歴書</h1>
            <div className="mt-1 text-xs text-bl-gray">BIGLIGHT JOB</div>
          </div>
          {/* 証明写真 3x4 */}
          {cvPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/candidate/documents?slot=cvphoto&file=${encodeURIComponent(cvPhoto)}`} alt="証明写真" className="h-[40mm] w-[30mm] flex-none border border-bl-line object-cover" />
          )}
        </div>

        {/* 1. 基本情報 */}
        <Section title="基本情報">
          <Grid rows={[
            ["氏名（ローマ字）", v(c.name)],
            ["フリガナ", v(c.kana)],
            ["生年月日", ymd(c.birthdate)],
            ["性別", genderJP(c.gender)],
            ["国籍", v(c.nationality)],
            ["電話番号", v(c.phone)],
            ["メールアドレス", v(email)],
          ]} />
        </Section>

        {/* 2. 現住所 */}
        <Section title="現住所">
          <Grid rows={[
            ["都道府県", v(c.currentAddress)],
            ["市区町村・番地・建物名", v(addressDetail)],
          ]} />
        </Section>

        {/* 3. 在留資格・日本語レベル */}
        <Section title="在留資格・日本語レベル">
          <Grid rows={[
            ["現在の在留資格", v(c.visaType)],
            ["特定技能分野", v(c.currentTokuteiField)],
            ["日本語レベル", v(c.japaneseLevel)],
            ["在留期限", c.visaExpiryDate ? ymd(c.visaExpiryDate) : "未記入"],
            ["来日年月日", ymdStr(p.arrival as string)],
          ]} />
        </Section>

        {/* 4. 職務経歴 */}
        <Section title="職務経歴">
          {workHistory.length === 0 ? (
            <p className="px-3 py-2 text-sm text-bl-gray2">未記入</p>
          ) : (
            <div className="divide-y divide-bl-line">
              {workHistory.map((w, i) => (
                <div key={i} className="rk-work py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <div className="text-sm font-bold text-ink">{v(w.company)}</div>
                    <div className="text-xs text-bl-gray">{formatYm(w.start) || "未記入"} 〜 {workEndLabel(w)}</div>
                  </div>
                  {w.work && <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{w.work}</div>}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 5. 希望条件 */}
        <Section title="希望条件">
          <Grid rows={wishRows} />
        </Section>

        {/* 6. 添付書類一覧 */}
        <Section title="添付書類一覧">
          <div className="divide-y divide-bl-line">
            {DOCLIST.map((d) => {
              const done = (docs[d.id]?.length ?? 0) > 0;
              return (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-ink">{d.label}</span>
                  <span className={done ? "font-bold text-bl-green" : "text-bl-gray2"}>{done ? "提出済み" : "未提出"}</span>
                </div>
              );
            })}
          </div>
        </Section>

        <p className="mt-5 text-right text-[10px] text-bl-gray2">この履歴書は BIGLIGHT JOB で作成されました。</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rk-sec mb-4">
      <h2 className="mb-1.5 border-l-4 border-bl-red pl-2 text-[15px] font-black text-ink">{title}</h2>
      <div className="rounded-md border border-bl-line">{children}</div>
    </section>
  );
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-bl-line">
      {rows.map(([k, val]) => (
        <div key={k} className="flex gap-3 px-3 py-2">
          <dt className="w-[38%] flex-none text-sm font-bold text-bl-gray">{k}</dt>
          <dd className={`min-w-0 flex-1 whitespace-pre-wrap text-sm ${val === "未記入" ? "text-bl-gray2" : "text-ink"}`}>{val}</dd>
        </div>
      ))}
    </dl>
  );
}
