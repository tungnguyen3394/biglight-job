import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { industryImage } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { jobPostingJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/common/JsonLd";
import { getSessionUser } from "@/lib/auth";
import Shell from "@/components/candidate/Shell";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import { SaveButton } from "@/components/candidate/SaveButton";
import { ApplyButton } from "@/components/candidate/ApplyButton";
import RecommendScore from "@/components/candidate/RecommendScore";
import { computeMatch, type Recommend } from "@/lib/recommend";

export const dynamic = "force-dynamic";

function fmtYen(n?: number | null) {
  return typeof n === "number" ? "¥" + n.toLocaleString("ja-JP") : "—";
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await prisma.job.findFirst({ where: { id: params.id, publicStatus: "PUBLIC" }, select: { id: true, title: true, industry: true, location: true, city: true, payType: true, baseSalary: true, salaryMin: true, description: true, imageUrl: true } });
  if (!job) return buildMetadata({ title: "求人が見つかりません｜BIGLIGHT JOB", noIndex: true });
  const loc = `${job.location}${job.city ? " " + job.city : ""}`;
  const pay = job.baseSalary ? `${job.payType ?? ""} ¥${job.baseSalary.toLocaleString("ja-JP")}` : job.salaryMin ? `¥${job.salaryMin.toLocaleString("ja-JP")}〜` : "";
  const title = `${job.title}｜${loc}${pay ? "・" + pay : ""}｜BIGLIGHT JOB`;
  const desc = (job.description || `${job.industry}の特定技能求人（${loc}）。BIGLIGHT JOBで無料応募できます。`).replace(/\s+/g, " ").slice(0, 160);
  return buildMetadata({ title, description: desc, path: `/jobs/${job.id}`, image: job.imageUrl || industryImage(job.industry) });
}

const Empty = <p className="text-sm text-bl-gray2">未更新</p>;

function KV({ rows }: { rows: [string, string | null][] }) {
  const shown = rows.filter(([, v]) => v);
  if (shown.length === 0) return Empty;
  return (
    <dl className="divide-y divide-bl-line">
      {shown.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[104px_1fr] gap-3 py-2.5 text-sm">
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

export default async function JobDetail({ params, searchParams }: { params: { id: string }; searchParams: { apply?: string } }) {
  const job = await prisma.job.findFirst({ where: { id: params.id, publicStatus: "PUBLIC" } });
  if (!job) notFound();

  // dữ liệu admin nhập thêm (formData) — chỉ hiển thị khi có
  const fd = (job.formData as Record<string, unknown>) || {};
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter(Boolean).map(String) : []);
  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const benefits = arr(fd.benefits);
  const appeal = arr(fd.appeal);
  const active = arr(fd.active);
  const quals = arr(fd.quals);
  const nearby = arr(fd.nearby);
  const payNote = str(fd.payNote);

  const chip = job.industry.includes("製造") ? "bg-bl-bluesoft text-bl-blue" : job.industry.includes("建設") ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-greensoft text-bl-green";
  const session = await getSessionUser();
  const loggedIn = session?.role === "CANDIDATE";
  const open = job.status === "OPEN" && job.recruitCount > job.hiredCount;
  let saved = false;
  let rec: Recommend | null = null;
  if (session?.role === "CANDIDATE") {
    const cand = await prisma.candidate.findUnique({ where: { userId: session.id }, select: { savedJobIds: true, desiredSalary: true, desiredLocation: true, gender: true, nationality: true, japaneseLevel: true, desiredIndustry: true } });
    saved = (cand?.savedJobIds ?? []).includes(job.id);
    rec = computeMatch(cand ?? null, {
      industry: job.industry, location: job.location, genderCondition: job.genderCondition, nationalityCondition: job.nationalityCondition,
      nationalityText: `${job.title} ${job.description ?? ""} ${(job.tags ?? []).join(" ")}`,
      japaneseLevel: job.japaneseLevel, monthly: job.expectedMonthly ?? job.salaryMin,
    });
  }
  const updatedAt = job.updatedAt.toLocaleDateString("ja-JP");
  const loc = `${job.location}${job.city ? ` ${job.city}` : ""}`;

  const hasSalary = job.baseSalary != null || job.expectedMonthly != null || job.expectedTakeHome != null;
  const sal = (fd.salary as { hourly?: number; monthlyBase?: number; allowanceTotal?: number; overtimePay?: number; gross?: number } | undefined) || undefined;
  const allowances = (Array.isArray(fd.allowances) ? fd.allowances : []) as { name?: string; amount?: number | ""; note?: string }[];
  const numOrU = (v: unknown) => (typeof v === "number" ? v : undefined);
  const wkDays = numOrU(fd.workDays), wkHours = numOrU(fd.workHoursPerDay), otHours = numOrU(fd.overtimeMonthly), otRate = numOrU(fd.overtimeRate);
  // chỉ giữ ô điều kiện làm việc CÓ dữ liệu (đã xóa thì không hiện)
  const workCells = ([
    wkDays != null ? ["勤務日数 / 月", `${wkDays}日`] : null,
    wkHours != null ? ["労働時間 / 1日", `${wkHours}時間`] : null,
    otHours != null ? ["残業時間 / 月", `${otHours}時間`] : null,
  ].filter(Boolean)) as [string, string][];
  const hasHousing = job.dormitoryAvailable || !!str(fd.houseType) || job.dormitoryFee != null || !!job.utilitiesCost || !!job.wifi || !!job.commuteMethod || !!str(fd.room) || !!str(fd.roomDesc) || !!str(fd.otherCost) || typeof fd.roommates === "number";
  const hasContent = !!job.description || appeal.length > 0 || active.length > 0;

  const jobLd = jobPostingJsonLd({
    title: job.title,
    description: (job.description || `${job.industry}の特定技能求人（${loc}）`).replace(/\s+/g, " ").slice(0, 4000),
    path: `/jobs/${job.id}`,
    datePosted: job.createdAt.toISOString(),
    region: job.location, city: job.city,
    payType: job.payType, baseSalary: job.baseSalary, salaryMin: job.salaryMin, salaryMax: job.salaryMax,
    image: job.imageUrl || industryImage(job.industry),
  });
  const bcLd = breadcrumbJsonLd([{ name: "ホーム", path: "/" }, { name: "特定技能求人一覧", path: "/jobs" }, { name: job.title, path: `/jobs/${job.id}` }]);
  // 3 điểm nổi bật (từ tags/待遇 có sẵn — KHÔNG thêm field mới)
  const highlights = [...new Set([...(job.tags ?? []), ...benefits, job.dormitoryAvailable ? "寮あり" : ""].filter(Boolean))].slice(0, 3);

  return (
    <Shell active="jobs" loggedIn={loggedIn}>
      <JsonLd data={[jobLd, bcLd]} />
      <div className="mx-auto max-w-2xl px-4 py-5 min-[1200px]:max-w-[1200px]">
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-bl-gray hover:text-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>求人一覧へ戻る
        </Link>

        {/* Mobile-first: 1 cột (ảnh→summary→chi tiết). Desktop ≥1200: 2 cột, summary phải sticky. */}
        <div className="mt-3 min-[1200px]:grid min-[1200px]:grid-cols-[minmax(0,1fr)_380px] min-[1200px]:items-start min-[1200px]:gap-6">

          {/* ① Ảnh — chỉ 求人コード + trạng thái */}
          <div className="relative h-40 overflow-hidden rounded-2xl sm:h-52 min-[1200px]:col-start-1 min-[1200px]:row-start-1 min-[1200px]:h-72">
            <img src={job.imageUrl || industryImage(job.industry)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">{job.code}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${open ? (job.isUrgent ? "bg-bl-red" : "bg-bl-green") : "bg-bl-gray"}`}>{open ? (job.isUrgent ? "急募" : "募集中") : "募集終了"}</span>
            </div>
          </div>

          {/* ②–⑧ Summary — mobile: sau ảnh; desktop: cột phải sticky */}
          <div className="mt-4 min-[1200px]:col-start-2 min-[1200px]:row-start-1 min-[1200px]:row-span-2 min-[1200px]:mt-0">
            <div className="space-y-3 min-[1200px]:sticky min-[1200px]:top-6">
              <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
                {/* ② Tên */}
                <h1 className="text-xl font-black leading-snug text-ink">{job.title}</h1>
                {/* ③ Địa điểm + ngành */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1 text-bl-gray"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>{loc}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip}`}>{job.industry}</span>
                  {job.jobTypeName && <span className="text-xs font-semibold text-bl-gray2">{job.jobTypeName}</span>}
                </div>
                {/* ④ 3 điểm nổi bật */}
                {highlights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {highlights.map((h) => <span key={h} className="rounded-full bg-bl-greensoft px-2.5 py-1 text-xs font-bold text-bl-green">{h}</span>)}
                  </div>
                )}
                {/* ⑤ Lương: 時給 → 月収見込み → 手取り(đỏ, nổi bật nhất) */}
                {hasSalary && (
                  <div className="mt-4 space-y-1.5 border-t border-bl-line pt-3">
                    {sal?.hourly ? <div className="flex items-center justify-between text-sm"><span className="text-bl-gray">時給</span><span className="font-bold text-ink">{fmtYen(sal.hourly)}</span></div> : null}
                    {(sal?.gross || job.expectedMonthly != null) ? <div className="flex items-center justify-between text-sm"><span className="text-bl-gray">月収見込み</span><span className="font-bold text-ink">{fmtYen((sal?.gross ?? job.expectedMonthly) as number)}</span></div> : null}
                    {job.expectedTakeHome != null && (
                      <div className="mt-1 flex items-center justify-between rounded-xl bg-bl-redsoft px-3 py-2.5">
                        <span className="text-sm font-bold text-bl-red">手取り給与（概算）</span>
                        <span className="text-2xl font-black leading-none text-bl-red">{fmtYen(job.expectedTakeHome)}</span>
                      </div>
                    )}
                  </div>
                )}
                {/* ⑥ Nút ứng tuyển */}
                <div className="mt-4">
                  <ApplyButton jobId={job.id} jobTitle={job.title} loggedIn={loggedIn} autoOpen={searchParams.apply === "1"} />
                  <p className="mt-2 text-center text-xs text-bl-gray2">プロフィールだけで簡単応募</p>
                  <div className="mt-2 flex justify-center"><SaveButton jobId={job.id} initialSaved={saved} loggedIn={loggedIn} /></div>
                </div>
              </div>
              {/* ⑦ おすすめ度 + ⑧ 相談 */}
              <RecommendScore jobId={job.id} jobTitle={job.title} loggedIn={loggedIn} rec={rec} />
            </div>
          </div>

          {/* Chi tiết — mobile: sau summary; desktop: cột trái dưới ảnh */}
          <div className="mt-4 space-y-4 min-[1200px]:col-start-1 min-[1200px]:row-start-2 min-[1200px]:mt-5 min-[1200px]:space-y-5">
          {/* 給与詳細 */}
          <Card title="給与詳細">
            {hasSalary ? (
              <div className="space-y-3">
                {/* 1. 基本給 */}
                {job.baseSalary != null && (
                  <div className="rounded-xl bg-bl-bg p-4">
                    <div className="text-xs text-bl-gray">基本給{job.payType ? `（${job.payType}）` : ""}</div>
                    <div className="text-2xl font-black text-bl-red">{fmtYen(job.baseSalary)}</div>
                    {(sal?.hourly || sal?.monthlyBase) && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-bl-gray2">
                        {sal?.hourly ? <span>時給換算：<b className="text-bl-gray">{fmtYen(sal.hourly)}</b></span> : null}
                        {sal?.monthlyBase ? <span>基本給（月額）：<b className="text-bl-gray">{fmtYen(sal.monthlyBase)}</b></span> : null}
                      </div>
                    )}
                    {payNote && <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-bl-gray2">{payNote}</p>}
                  </div>
                )}

                {/* 2. 各種手当 */}
                {allowances.length > 0 && (
                  <div className="rounded-xl border border-bl-line p-4">
                    <div className="mb-1.5 text-xs font-bold text-bl-gray">各種手当</div>
                    <ul className="space-y-1 text-sm">
                      {allowances.map((a, i) => (
                        <li key={i} className="flex items-start justify-between gap-2">
                          <span>{a.name}{a.note ? <span className="ml-1 text-xs text-bl-gray2">（{a.note}）</span> : null}</span>
                          {a.amount != null && a.amount !== "" && <span className="shrink-0 font-bold">{fmtYen(a.amount as number)}</span>}
                        </li>
                      ))}
                    </ul>
                    {sal?.allowanceTotal ? <div className="mt-2 flex items-center justify-between border-t border-bl-line pt-2 text-sm font-bold"><span>手当合計</span><span>{fmtYen(sal.allowanceTotal)}</span></div> : null}
                  </div>
                )}

                {/* 3. 勤務条件 — chỉ ô có dữ liệu */}
                {workCells.length > 0 && (
                  <div className="rounded-xl border border-bl-line p-4">
                    <div className="mb-2 text-xs font-bold text-bl-gray">勤務条件（目安）</div>
                    <div className="grid gap-2 text-center text-sm" style={{ gridTemplateColumns: `repeat(${workCells.length}, minmax(0, 1fr))` }}>
                      {workCells.map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-bl-bg py-2"><div className="text-[11px] text-bl-gray">{label}</div><div className="font-bold text-ink">{value}</div></div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. 残業代見込み */}
                {sal?.overtimePay ? (
                  <div className="flex items-center justify-between rounded-xl border border-bl-line px-4 py-3 text-sm">
                    <span className="text-bl-gray">残業代見込み{otRate ? `（時給×${otRate}×${otHours ?? "?"}h）` : ""}</span>
                    <span className="font-bold text-ink">{fmtYen(sal.overtimePay)}</span>
                  </div>
                ) : null}

                {/* 5. 総支給見込み — nổi bật */}
                {(sal?.gross || job.expectedMonthly != null) && (
                  <div className="rounded-2xl border-2 border-bl-red/25 bg-bl-redsoft/40 px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="leading-tight"><div className="text-sm font-black text-ink">総支給見込み</div><div className="text-[10px] text-bl-gray2">税金・社会保険を引く前</div></div>
                      <div className="text-2xl font-black text-ink">{fmtYen((sal?.gross ?? job.expectedMonthly) as number)}</div>
                    </div>
                  </div>
                )}

                {/* 6. 手取り給与（概算）— nổi bật nhất */}
                {job.expectedTakeHome != null && (
                  <div className="rounded-2xl bg-bl-red p-5 text-white shadow-lg shadow-bl-red/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black">手取り給与（概算）</div>
                      <div className="text-3xl font-black leading-none">{fmtYen(job.expectedTakeHome)}</div>
                    </div>
                    <p className="mt-2.5 text-[11px] leading-relaxed text-white/85">※税金・社会保険などを考慮した概算金額です。実際の手取り額は勤務条件や控除内容により異なります。</p>
                  </div>
                )}
              </div>
            ) : Empty}
          </Card>

          {/* 住居・生活 */}
          <Card title="住居・生活">
            {hasHousing ? (
              <KV rows={[
                ["住居タイプ", str(fd.houseType) || (job.dormitoryAvailable ? "寮あり" : null)],
                ["個室／相部屋", str(fd.room)],
                ["同居人数", typeof fd.roommates === "number" ? `${fd.roommates}人` : null],
                ["部屋の説明", str(fd.roomDesc)],
                ["家賃", job.dormitoryFee != null ? `${fmtYen(job.dormitoryFee)} / 月` : null],
                ["電気・水道・ガス", job.utilitiesCost],
                ["インターネット", job.wifi],
                ["その他実費", str(fd.otherCost)],
                ["通勤方法", job.commuteMethod],
              ]} />
            ) : Empty}
          </Card>

          {/* 3. 仕事内容 */}
          <Card title="仕事内容">
            {hasContent ? (
              <>
                {job.description && <p className="whitespace-pre-wrap text-sm leading-relaxed text-bl-gray">{job.description}</p>}
                {appeal.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-1.5 text-sm font-bold text-bl-red">仕事の魅力</h3>
                    <ul className="space-y-1.5">{appeal.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm text-bl-gray"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-bl-red" />{a}</li>)}</ul>
                  </div>
                )}
                {active.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-1.5 text-sm font-bold text-bl-red">こんな人が活躍しています</h3>
                    <ul className="space-y-1.5">{active.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm text-bl-gray"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-bl-red" />{a}</li>)}</ul>
                  </div>
                )}
              </>
            ) : Empty}
          </Card>

          {nearby.length > 0 && (
            <Card title="近隣情報">
              <ul className="space-y-2">
                {nearby.map((n, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-bl-gray">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D02E26" strokeWidth="2" className="flex-none"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    {n}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* 4. 募集要項 */}
          <Card title="募集要項">
            <KV rows={[
              ["雇用期間", str(fd.term) || job.employmentType],
              ["勤務時間", job.workHours],
              ["休日・休暇", job.holidays],
              ["賞与・昇給", job.bonus],
              ["募集人数", `${job.recruitCount}名（男性${job.recruitMale}・女性${job.recruitFemale}）`],
            ]} />
            {benefits.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-1.5 text-sm font-bold text-bl-red">待遇・福利厚生</h3>
                <div className="flex flex-wrap gap-1.5">{benefits.map((b, i) => <span key={i} className="rounded-full bg-bl-greensoft px-2.5 py-1 text-xs font-semibold text-bl-green">{b}</span>)}</div>
              </div>
            )}
          </Card>

          <Card title="応募条件">
            <KV rows={[
              ["日本語レベル", job.japaneseLevel],
              ["入社できる時期", str(fd.start)],
              ["必要な資格", quals.length > 0 ? quals.join("\n") : job.requiredQualification],
            ]} />
          </Card>

          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((t) => <span key={t} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-bl-gray shadow-sm">#{t}</span>)}
            </div>
          )}

          {/* thông tin cuối */}
          <div className="rounded-2xl border border-bl-line bg-white p-4">
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between"><dt className="text-bl-gray2">求人ID</dt><dd className="font-mono font-bold text-bl-gray">{job.code}</dd></div>
              <div className="flex justify-between"><dt className="text-bl-gray2">更新日</dt><dd className="font-semibold text-bl-gray">{updatedAt}</dd></div>
            </dl>
          </div>
        </div>{/* /chi tiết */}
        </div>{/* /grid */}
      </div>
      <MessengerPopupButton />
    </Shell>
  );
}
