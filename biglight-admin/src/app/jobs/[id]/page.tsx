import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RESIDENCE_LABEL } from "@/lib/constants";
import PublicHeader from "@/components/public/PublicHeader";

export const dynamic = "force-dynamic";

function yen(n?: number | null) {
  return typeof n === "number" ? "¥" + n.toLocaleString("ja-JP") : "—";
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6">
      <h2 className="mb-1.5 text-sm font-bold text-navy">{title}</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{body}</p>
    </div>
  );
}

export default async function JobDetail({ params }: { params: { id: string } }) {
  const job = await prisma.job.findFirst({
    where: { id: params.id, publicStatus: "PUBLIC" },
    include: { company: true },
  });
  if (!job) notFound();

  // Chỉ hiển thị các trường an toàn cho người ngoài (KHÔNG có memo nội bộ/rủi ro).
  const rows: [string, string | null][] = [
    ["業種", job.industry],
    ["職種", job.jobTypeName],
    ["在留資格", RESIDENCE_LABEL[job.residenceType]],
    ["勤務地", `${job.location}${job.city ? " " + job.city : ""}`],
    ["募集人数", `${job.recruitCount}名`],
    ["日本語レベル", job.japaneseLevel],
    ["勤務時間", job.workHours],
    ["休日", job.holidays],
    ["寮", job.dormitoryAvailable ? (job.dormitoryFee ? `あり（寮費 ${yen(job.dormitoryFee)}）` : "あり") : "なし"],
  ];

  const mailto = `mailto:info@biglight.jp?subject=${encodeURIComponent(`【応募】${job.code} ${job.title}`)}`;

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-navy">
          ← 求人一覧へ戻る
        </Link>

        <article className="card mt-4 p-6">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="badge bg-brand-light text-navy">{RESIDENCE_LABEL[job.residenceType]}</span>
            {job.dormitoryAvailable && <span className="badge bg-emerald-50 text-emerald-700">寮あり</span>}
          </div>
          <h1 className="text-2xl font-black text-navy">{job.title}</h1>
          <p className="mt-1 text-slate-600">{job.company.name}</p>

          {/* Salary highlight */}
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">想定月収</p>
            <p className="text-2xl font-black text-navy">
              {job.salaryMin && job.salaryMax ? `${yen(job.salaryMin)} 〜 ${yen(job.salaryMax)}` : yen(job.expectedMonthly)}
            </p>
            {job.expectedTakeHome && (
              <p className="mt-1 text-xs text-slate-500">手取り目安 {yen(job.expectedTakeHome)}</p>
            )}
          </div>

          {/* Key facts */}
          <dl className="mt-6 divide-y divide-slate-100">
            {rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-4 py-2.5 text-sm">
                  <dt className="w-28 shrink-0 font-semibold text-slate-500">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
          </dl>

          {job.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.tags.map((t) => (
                <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Mô tả công khai */}
          {job.description && <Section title="仕事内容" body={job.description} />}
          {job.dailyFlow && <Section title="一日の流れ" body={job.dailyFlow} />}
          {job.appealPoints && <Section title="仕事の魅力" body={job.appealPoints} />}
          {job.publicMemo && <Section title="補足" body={job.publicMemo} />}
          {job.applyNotes && <Section title="応募時の注意" body={job.applyNotes} />}

          {/* CTA liên hệ */}
          <div className="mt-8 rounded-lg border border-slate-200 bg-brand-light/50 p-5 text-center">
            <p className="text-sm text-slate-600">この求人に興味がありますか？</p>
            <a href={mailto} className="btn btn-navy mt-3">
              お問い合わせ・応募する
            </a>
          </div>
        </article>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} BIGLIGHT Job
      </footer>
    </div>
  );
}
