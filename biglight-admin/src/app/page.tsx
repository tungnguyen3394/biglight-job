import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RESIDENCE_LABEL } from "@/lib/constants";
import PublicHeader from "@/components/public/PublicHeader";

// Trang công khai luôn lấy dữ liệu mới (không prerender lúc build → không cần DB khi build).
export const dynamic = "force-dynamic";

function yen(n?: number | null) {
  return typeof n === "number" ? "¥" + n.toLocaleString("ja-JP") : null;
}

export default async function Home() {
  const jobs = await prisma.job.findMany({
    where: { publicStatus: "PUBLIC", status: "OPEN" },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-3xl font-black sm:text-4xl">特定技能・育成就労の求人</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
            BIGLIGHTが厳選した、外国人材向けの優良求人。寮あり・未経験OKの仕事を探そう。
          </p>
        </div>
      </section>

      {/* Job list */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-black text-navy">公開中の求人</h2>
          <span className="text-sm text-slate-500">{jobs.length}件</span>
        </div>

        {jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
            現在公開中の求人はありません。
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="card group flex flex-col p-5 transition hover:shadow-md"
              >
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <span className="badge bg-brand-light text-navy">{RESIDENCE_LABEL[job.residenceType]}</span>
                  {job.dormitoryAvailable && <span className="badge bg-emerald-50 text-emerald-700">寮あり</span>}
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-navy">{job.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{job.company.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  📍 {job.location}
                  {job.city ? ` ${job.city}` : ""}
                </p>
                {(yen(job.salaryMin) || yen(job.expectedMonthly)) && (
                  <p className="mt-3 text-sm font-bold text-navy">
                    {job.salaryMin && job.salaryMax
                      ? `${yen(job.salaryMin)} 〜 ${yen(job.salaryMax)}`
                      : yen(job.expectedMonthly) ?? yen(job.salaryMin)}
                    <span className="ml-1 text-xs font-normal text-slate-400">/月</span>
                  </p>
                )}
                {job.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.tags.slice(0, 4).map((t) => (
                      <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <span className="mt-4 text-sm font-semibold text-brand-blue">詳細を見る →</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} BIGLIGHT Job
      </footer>
    </div>
  );
}
