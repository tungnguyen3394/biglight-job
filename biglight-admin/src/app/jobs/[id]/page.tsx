import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RESIDENCE_LABEL, GENDER_LABEL } from "@/lib/constants";
import { industryImage, CONTACT_EMAIL, FB_PAGE_URL } from "@/lib/site";
import { getSessionUser } from "@/lib/auth";
import Shell from "@/components/candidate/Shell";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import { SaveButton } from "@/components/candidate/SaveButton";
import { ApplyButton } from "@/components/candidate/ApplyButton";

const LINE_URL = "https://line.me/R/ti/p/@biglight";
const FLOW = ["応募", "書類選考", "面接（オンライン可）", "内定", "ビザ申請", "入社"];

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

export default async function JobDetail({ params, searchParams }: { params: { id: string }; searchParams: { apply?: string } }) {
  const job = await prisma.job.findFirst({
    where: { id: params.id, publicStatus: "PUBLIC" },
  });
  if (!job) notFound();

  // dữ liệu phong phú từ form tạo求人 (đúng cấu trúc HTML)
  const fd = (job.formData as Record<string, unknown>) || {};
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter(Boolean).map(String) : []);
  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const benefits = arr(fd.benefits);
  const appeal = arr(fd.appeal);
  const active = arr(fd.active);
  const quals = arr(fd.quals);
  const nearby = arr(fd.nearby);

  const chip = job.industry.includes("製造") ? "bg-bl-bluesoft text-bl-blue" : job.industry.includes("建設") ? "bg-bl-ambersoft text-bl-amber" : "bg-bl-greensoft text-bl-green";

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`【お問い合わせ】${job.code} ${job.title}`)}`;
  const session = await getSessionUser();
  const loggedIn = !!session;
  const open = job.status === "OPEN" && job.recruitCount > job.hiredCount;
  let saved = false;
  if (session?.role === "CANDIDATE") {
    const cand = await prisma.candidate.findUnique({ where: { userId: session.id }, select: { savedJobIds: true } });
    saved = (cand?.savedJobIds ?? []).includes(job.id);
  }
  const updatedAt = job.updatedAt.toLocaleDateString("ja-JP");

  return (
    <Shell active="jobs" loggedIn={loggedIn}>
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-bl-gray hover:text-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>求人一覧へ戻る
        </Link>

        {/* Hero image (full width) */}
        <div className="relative mt-3 h-52 overflow-hidden rounded-2xl sm:h-64">
          <img src={job.imageUrl || industryImage(job.industry)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute right-3 top-3"><SaveButton jobId={job.id} initialSaved={saved} loggedIn={loggedIn} /></div>
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur">{job.code}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${chip}`}>{job.industry}</span>
              {job.jobTypeName && <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur">{job.jobTypeName}</span>}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${open ? "bg-bl-green text-white" : "bg-bl-gray text-white"}`}>{open ? "募集中" : "募集終了"}</span>
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">{job.title}</h1>
            <p className="flex items-center gap-1 text-sm text-white/90">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              {job.location}{job.city ? ` ${job.city}` : ""}
            </p>
          </div>
        </div>

        {/* Desktop: 2 cột (nội dung trái + thẻ lương/ứng tuyển dính phải) — Mobile: 1 cột */}
        <div className="mt-5 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
          {/* MAIN */}
          <div className="space-y-5 lg:order-1">
            {(job.description || job.dailyFlow || appeal.length > 0 || active.length > 0) && (
              <Card title="仕事内容">
                {job.description && <p className="whitespace-pre-wrap text-sm leading-relaxed text-bl-gray">{job.description}</p>}
                {job.dailyFlow && <div className="mt-4"><h3 className="mb-1 text-sm font-bold text-bl-red">一日の流れ</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-bl-gray">{job.dailyFlow}</p></div>}
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
              </Card>
            )}

            <Card title="募集要項">
              <KV rows={[
                ["雇用期間", str(fd.term) || job.employmentType],
                ["在留資格", RESIDENCE_LABEL[job.residenceType] ?? job.residenceType],
                ["勤務時間", job.workHours],
                ["残業", job.overtimeHours],
                ["休日・休暇", job.holidays],
                ["賞与・昇給", job.bonus],
                ["通勤手段", job.commuteMethod],
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
                ["年齢", job.ageMin || job.ageMax ? `${job.ageMin ?? ""}〜${job.ageMax ?? ""}歳` : null],
                ["性別", job.genderCondition !== "ANY" ? GENDER_LABEL[job.genderCondition] : "不問"],
                ["必要な経験", job.requiredExperience],
                ["必要な資格", quals.length > 0 ? quals.join("\n") : job.requiredQualification],
              ]} />
            </Card>

            {(job.dormitoryAvailable || str(fd.houseType)) && (
              <Card title="住居・生活">
                <KV rows={[
                  ["住居タイプ", str(fd.houseType) || (job.dormitoryAvailable ? "寮あり" : null)],
                  ["個室／相部屋", str(fd.room)],
                  ["同居人数", typeof fd.roommates === "number" ? `${fd.roommates}人` : null],
                  ["部屋の説明", str(fd.roomDesc)],
                  ["家賃", job.dormitoryFee ? `${fmtYen(job.dormitoryFee)} / 月` : null],
                  ["電気・水道・ガス", job.utilitiesCost],
                  ["インターネット", job.wifi],
                  ["その他実費", str(fd.otherCost)],
                  ["通勤方法", job.commuteMethod],
                ]} />
              </Card>
            )}

            {nearby.length > 0 && (
              <Card title="近隣情報（徒歩15分圏内）">
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

            <Card title="選考フロー">
              <ol className="flex flex-wrap items-center gap-y-3">
                {FLOW.map((step, i) => (
                  <li key={step} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-bl-redsoft text-xs font-black text-bl-red">{i + 1}</span>
                      <span className="text-sm font-semibold text-ink">{step}</span>
                    </div>
                    {i < FLOW.length - 1 && <svg width="22" height="16" viewBox="0 0 24 24" fill="none" stroke="#D7DBE0" strokeWidth="2" className="mx-1"><path d="M9 6l6 6-6 6" /></svg>}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-bl-gray2">面接はオンライン可。書類準備からビザ・渡航まで担当者がサポートします。</p>
            </Card>

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

              <ApplyButton jobId={job.id} jobTitle={job.title} loggedIn={loggedIn} autoOpen={searchParams.apply === "1"} />
              <p className="mt-1.5 text-center text-xs text-bl-gray2">無料・Facebook/Googleで登録</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-[#06C755] py-2.5 text-sm font-bold text-white hover:opacity-90">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 3C6.5 3 2 6.6 2 11c0 4 3.6 7.3 8.4 7.9.3.07.8.22.9.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1 .9.55 1.1-.46 5.9-3.5 8.05-5.98C21.4 14.6 22 12.9 22 11c0-4.4-4.5-8-10-8z" /></svg>
                  LINEで相談
                </a>
                <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-bl-fb py-2.5 text-sm font-bold text-white hover:bg-[#0C63D4]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
                  Facebook
                </a>
              </div>

              <dl className="mt-4 space-y-1.5 border-t border-bl-line pt-3 text-xs">
                <div className="flex justify-between"><dt className="text-bl-gray2">求人ID</dt><dd className="font-mono font-bold text-bl-gray">{job.code}</dd></div>
                <div className="flex justify-between"><dt className="text-bl-gray2">更新日</dt><dd className="font-semibold text-bl-gray">{updatedAt}</dd></div>
              </dl>
              <a href={mailto} className="mt-3 block text-center text-xs text-bl-gray underline">メールで問い合わせる</a>
            </div>
          </aside>
        </div>
      </div>
      <MessengerPopupButton />
    </Shell>
  );
}
