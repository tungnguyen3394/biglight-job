import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RESIDENCE_LABEL, GENDER_LABEL } from "@/lib/constants";
import { industryImage, CONTACT_EMAIL } from "@/lib/site";
import Shell from "@/components/candidate/Shell";
import FbChat from "@/components/candidate/FbChat";

export const dynamic = "force-dynamic";

function fmtYen(n?: number | null) {
  return typeof n === "number" ? "¥" + n.toLocaleString("ja-JP") : "—";
}

function KV({ rows }: { rows: [string, string | null][] }) {
  const shown = rows.filter(([, v]) => v);
  if (shown.length === 0) return null;
  return (
    <dl className="divide-y divide-bl-line">
      {shown.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[110px_1fr] gap-3 py-2.5 text-sm">
          <dt className="font-semibold text-bl-gray">{k}</dt>
          <dd className="whitespace-pre-wrap text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
      <h2 className="mb-3 border-l-4 border-bl-red pl-2.5 text-base font-black">{title}</h2>
      {children}
    </section>
  );
}

export default async function JobDetail({ params }: { params: { id: string } }) {
  const job = await prisma.job.findFirst({
    where: { id: params.id, publicStatus: "PUBLIC" },
  });
  if (!job) notFound();

  const chip = job.industry.includes("製造") ? "bg-bl-bluesoft text-bl-blue" : job.industry.includes("建設") ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-greensoft text-bl-green";
  const applyHref = `/mypage?apply=${encodeURIComponent(job.id)}&t=${encodeURIComponent(job.title)}`;

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`【お問い合わせ】${job.code} ${job.title}`)}`;

  return (
    <Shell active="jobs">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Link href="/" className="text-sm font-semibold text-bl-gray hover:text-ink">← 求人一覧へ戻る</Link>

        {/* Hero image (full width) */}
        <div className="relative mt-3 h-52 overflow-hidden rounded-2xl sm:h-64">
          <img src={industryImage(job.industry)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur">{job.code}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${chip}`}>{job.industry}</span>
              {job.jobTypeName && <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur">{job.jobTypeName}</span>}
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">{job.title}</h1>
            <p className="text-sm text-white/90">📍 {job.location}{job.city ? ` ${job.city}` : ""}</p>
          </div>
        </div>

        {/* Desktop: 2 cột (nội dung trái + thẻ lương/ứng tuyển dính phải) — Mobile: 1 cột */}
        <div className="mt-5 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
          {/* MAIN */}
          <div className="space-y-5 lg:order-1">
            {(job.description || job.dailyFlow || job.appealPoints) && (
              <Card title="仕事内容">
                {job.description && <p className="whitespace-pre-wrap text-sm leading-relaxed text-bl-gray">{job.description}</p>}
                {job.dailyFlow && <div className="mt-4"><h3 className="mb-1 text-sm font-bold text-bl-red">一日の流れ</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-bl-gray">{job.dailyFlow}</p></div>}
                {job.appealPoints && <div className="mt-4"><h3 className="mb-1 text-sm font-bold text-bl-red">仕事の魅力</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-bl-gray">{job.appealPoints}</p></div>}
              </Card>
            )}

            <Card title="募集要項">
              <KV rows={[
                ["雇用形態", job.employmentType],
                ["在留資格", RESIDENCE_LABEL[job.residenceType] ?? job.residenceType],
                ["勤務時間", job.workHours],
                ["残業", job.overtimeHours],
                ["休日・休暇", job.holidays],
                ["賞与", job.bonus],
                ["昇給", job.raise],
                ["社会保険", job.socialInsurance],
                ["交通費", job.transportAllowance],
                ["募集人数", `${job.recruitCount}名（男性${job.recruitMale}・女性${job.recruitFemale}）`],
              ]} />
            </Card>

            <Card title="応募条件">
              <KV rows={[
                ["日本語レベル", job.japaneseLevel],
                ["年齢", job.ageMin || job.ageMax ? `${job.ageMin ?? ""}〜${job.ageMax ?? ""}歳` : null],
                ["性別", job.genderCondition !== "ANY" ? GENDER_LABEL[job.genderCondition] : "不問"],
                ["必要な経験", job.requiredExperience],
                ["必要な資格", job.requiredQualification],
              ]} />
            </Card>

            {job.dormitoryAvailable && (
              <Card title="住居・生活">
                <KV rows={[
                  ["寮", "あり"],
                  ["寮費", job.dormitoryFee ? `${fmtYen(job.dormitoryFee)} / 月` : null],
                  ["水道光熱費", job.utilitiesCost],
                  ["Wi-Fi", job.wifi],
                  ["通勤方法", job.commuteMethod],
                  ["駅からの距離", job.stationDistance],
                ]} />
              </Card>
            )}

            {job.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((t) => <span key={t} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-bl-gray shadow-sm">#{t}</span>)}
              </div>
            )}
          </div>

          {/* ASIDE — thẻ lương + ứng tuyển (dính khi cuộn trên desktop) */}
          <aside className="mt-5 lg:order-2 lg:mt-0">
            <div className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm lg:sticky lg:top-20">
              <div className="text-xs font-bold text-bl-gray2">{job.code}</div>
              <h2 className="mt-0.5 text-lg font-black leading-snug">{job.title}</h2>

              <div className="mt-4 rounded-xl bg-bl-bg p-4">
                <div className="text-xs text-bl-gray">基本給{job.payType ? `（${job.payType}）` : ""}</div>
                <div className="text-2xl font-black text-bl-red">{fmtYen(job.baseSalary)}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-bl-line pt-3 text-sm">
                  <div><div className="text-xs text-bl-gray">月収例</div><div className="font-bold">{fmtYen(job.expectedMonthly)}</div></div>
                  <div><div className="text-xs text-bl-gray">手取り目安</div><div className="font-bold">{fmtYen(job.expectedTakeHome)}</div></div>
                </div>
                {(job.salaryMin || job.salaryMax) && <div className="mt-2 text-xs text-bl-gray">給与レンジ {fmtYen(job.salaryMin)}〜{fmtYen(job.salaryMax)}</div>}
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-bl-gray">勤務地</dt><dd className="font-semibold">{job.location}{job.city ? ` ${job.city}` : ""}</dd></div>
                <div className="flex justify-between"><dt className="text-bl-gray">在留資格</dt><dd className="font-semibold">{RESIDENCE_LABEL[job.residenceType] ?? job.residenceType}</dd></div>
                <div className="flex justify-between"><dt className="text-bl-gray">募集人数</dt><dd className="font-semibold">{job.recruitCount}名</dd></div>
                {job.japaneseLevel && <div className="flex justify-between"><dt className="text-bl-gray">日本語</dt><dd className="font-semibold">{job.japaneseLevel}</dd></div>}
              </dl>

              <Link href={applyHref} className="mt-5 block rounded-xl bg-bl-red py-3.5 text-center font-bold text-white shadow-lg hover:bg-bl-redd">この求人に応募する</Link>
              <p className="mt-1.5 text-center text-xs text-bl-gray2">無料・Facebook/Googleで登録</p>
              <a href={mailto} className="mt-2 block text-center text-xs text-bl-gray underline">メールで問い合わせる</a>
            </div>
          </aside>
        </div>
      </div>
      <FbChat />
    </Shell>
  );
}
