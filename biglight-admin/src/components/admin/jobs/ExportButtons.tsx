"use client";

import { PUBLIC_STATUS_LABEL } from "@/lib/constants";
import { formatSalary, type JobRow } from "@/app/admin/jobs/types";
import { ExportBar } from "@/components/admin/toolbar";

function header(seeCommission: boolean): string[] {
  return ["求人ID", "求人タイトル", "企業名", "職種", "勤務地", "募集人数", "給与", "寮", "夜勤", "シフト", "公開",
    "担当者", ...(seeCommission ? ["紹介報酬"] : []), "更新日"];
}
function toRow(r: JobRow, seeCommission: boolean): string[] {
  return [
    r.code, r.title, r.company ?? "", r.jobType ?? "", `${r.location}${r.city ? " " + r.city : ""}`,
    `${r.recruitCount}名`, formatSalary(r.salaryMin, r.salaryMax),
    r.dormitory ? "あり" : "なし", r.nightShift ? "あり" : "なし", r.shiftWork ? "あり" : "なし",
    PUBLIC_STATUS_LABEL[r.publicStatus] ?? r.publicStatus, r.staff ?? "",
    ...(seeCommission ? [r.commission != null ? "¥" + r.commission.toLocaleString("ja-JP") : ""] : []),
    new Date(r.updatedAt).toLocaleDateString("ja-JP"),
  ];
}

export function ExportButtons({ rows, seeCommission }: { rows: JobRow[]; seeCommission: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <ExportBar filename="求人一覧" title="求人一覧" getData={() => ({ headers: header(seeCommission), rows: rows.map((r) => toRow(r, seeCommission)) })} />
    </div>
  );
}
