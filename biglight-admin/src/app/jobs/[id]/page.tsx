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
  const loggedIn = !!session;
  const open = job.status === "OPEN" && job.recruitCount > job.hiredCount;
  let saved = false;
  if (session?.role === "CANDIDATE") {
    const cand = await prisma.candidate.findUnique({ where: { userId: session.id }, select: { savedJobIds: true } });
    saved = (cand?.savedJobIds ?? []).includes(job.id);
  }
  const updatedAt = job.updatedAt.toLocaleDateString("ja-JP");
  const loc = `${job.location}${job.city ? ` ${job.city}` : ""}`;

  const hasSalary = job.baseSalary != null || job.expectedMonthly != null || job.expectedTakeHome != null;
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

  return (
    <Shell active="jobs" loggedIn={loggedIn}>
      <JsonLd data={[jobLd, bcLd]} />
      <div className="mx-auto max-w-3xl px-4 py-5">
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-bl-gray hover:text-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>求人一覧へ戻る
        </Link>

        {/* Hero — Mã đơn + trạng thái + Tỉnh/Thành (trên trái) · Yêu thích (trên phải) · Tiêu đề (đáy ảnh) */}
        <div className="relative mt-3 h-48 overflow-hidden rounded-2xl sm:h-60">
          <img src={job.imageUrl || industryImage(job.industry)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/70" />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">{job.code}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${open ? (job.isUrgent ? "bg-bl-red" : "bg-bl-green") : "bg-bl-gray"}`}>{open ? (job.isUrgent ? "急募" : "募集中") : "募集終了"}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              {loc}
            </span>
          </div>
          <div className="absolute right-3 top-3"><SaveButton jobId={job.id} initialSaved={saved} loggedIn={loggedIn} /></div>
          <div className="absolute inset-x-4 bottom-3.5">
            <h1 className="line-clamp-2 text-lg font-black leading-snug text-white drop-shadow-md sm:text-2xl">{job.title}</h1>
          </div>
        </div>

        {/* Nhãn phân loại (chỉ field admin nhập: 業種 / 職種) */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${chip}`}>{job.industry}</span>
          {job.jobTypeName && <span className="rounded-full bg-bl-bg px-2.5 py-0.5 text-[11px] font-bold text-bl-gray">{job.jobTypeName}</span>}
        </div>

        <div className="mt-5 space-y-4">
          {/* 1. 給与 */}
          <Card title="給与">
            {hasSalary ? (
              <div className="rounded-xl bg-bl-bg p-4">
                {job.baseSalary != null && (
                  <>
                    <div className="text-xs text-bl-gray">基本給{job.payType ? `（${job.payType}）` : ""}</div>
                    <div className="text-2xl font-black text-bl-red">{fmtYen(job.baseSalary)}</div>
                  </>
                )}
                {(job.expectedMonthly != null || job.expectedTakeHome != null) && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-bl-line pt-3 text-sm">
                    {job.expectedMonthly != null && <div><div className="text-xs text-bl-gray">月収例</div><div className="font-bold">{fmtYen(job.expectedMonthly)}</div></div>}
                    {job.expectedTakeHome != null && <div><div className="text-xs text-bl-gray">手取り目安</div><div className="font-bold">{fmtYen(job.expectedTakeHome)}</div></div>}
                  </div>
                )}
                {payNote && <p className="mt-3 whitespace-pre-wrap border-t border-bl-line pt-3 text-xs leading-relaxed text-bl-gray">{payNote}</p>}
              </div>
            ) : Empty}
          </Card>

          {/* CTA ứng tuyển — trang trí hoàn chỉnh */}
          <div className="rounded-2xl border border-bl-red/20 bg-gradient-to-br from-bl-redsoft/50 to-white p-4 shadow-sm">
            <ApplyButton jobId={job.id} jobTitle={job.title} loggedIn={loggedIn} autoOpen={searchParams.apply === "1"} />
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-xs text-bl-gray2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              {loggedIn ? "プロフィール情報でかんたん応募" : "無料・Facebook / Google で30秒登録"}
            </p>
          </div>

          {/* 2. 住居・生活 */}
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
              ["残業", job.overtimeHours],
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
        </div>
      </div>
      <MessengerPopupButton />
    </Shell>
  );
}
