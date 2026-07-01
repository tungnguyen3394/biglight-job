import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveAdminLevel } from "@/lib/adminAccess";
import { Forbidden } from "@/components/admin/Forbidden";
import { Avatar } from "@/components/common/Avatar";

export const dynamic = "force-dynamic";

// Chi tiết admin/staff — layout kiểu hồ sơ応募者. Chỉ UI; các trường chưa có trong DB hiển thị placeholder.
export default async function Page({ params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me || effectiveAdminLevel(me) !== "ADMIN") return <Forbidden />;

  const u = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true, adminRole: true, image: true, createdAt: true, lastLoginAt: true },
  });
  if (!u) notFound();

  const perm = u.adminRole === "ADMIN" || u.role === "SUPER_ADMIN" || u.role === "MANAGER" ? "Admin" : "Staff";
  const dash = <span className="text-slate-300">未設定</span>;
  // ⚠ Các trường dưới chưa có cột trong DB → placeholder (UI trước). name/email/権限 là dữ liệu thật.
  const rows: [string, ReactNode][] = [
    ["氏名", u.name || dash],
    ["生年月日 / 年齢", dash],
    ["役職", dash],
    ["メール", u.email || dash],
    ["電話番号", dash],
    ["Facebook URL", dash],
    ["Instagram URL", dash],
    ["メモ", dash],
    ["権限", <span key="p" className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${perm === "Admin" ? "bg-bl-redsoft text-bl-red" : "bg-slate-100 text-slate-600"}`}>{perm}</span>],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-ink">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>ユーザー管理へ戻る
      </Link>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={u.name} src={u.image ?? undefined} size={72} />
          <div className="min-w-0">
            <h1 className="text-xl font-black text-ink">{u.name || "（無名）"}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${perm === "Admin" ? "bg-bl-redsoft text-bl-red" : "bg-slate-100 text-slate-600"}`}>{perm}</span>
              <span className="truncate text-xs text-slate-400">{u.email}</span>
            </div>
          </div>
          <Link href="/admin/users" className="btn btn-navy btn-sm ml-auto">編集</Link>
        </div>

        <dl className="mt-6 divide-y divide-slate-100">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[130px_1fr] gap-3 py-3 text-sm">
              <dt className="font-semibold text-slate-500">{k}</dt>
              <dd className="min-w-0 text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-[11px] leading-relaxed text-slate-400">※ 生年月日・役職・電話番号・SNS・メモ は今後追加予定の項目です（現在は未接続）。編集は「ユーザー管理」一覧から行えます。</p>
      </div>
    </div>
  );
}
