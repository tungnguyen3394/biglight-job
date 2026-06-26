"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RESIDENCE_LABEL,
  PUBLIC_STATUS_LABEL,
  GENDER_LABEL,
  REWARD_TYPE_LABEL,
  PAYMENT_TIMING_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/constants";

type Opt = { id: string; name: string };

// ---- tiny field helpers ----
function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
function Num({ label, value, onChange }: { label: string; value: number | ""; onChange: (v: number | "") => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type="number" value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
    </div>
  );
}
function Area({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="md:col-span-2">
      <label className="label">{label}</label>
      {hint && <p className="-mt-1 mb-1 text-xs text-slate-400">{hint}</p>}
      <textarea className="input min-h-24" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(true)} className={`btn ${value ? "btn-navy" : "btn-ghost"}`}>あり</button>
        <button type="button" onClick={() => onChange(false)} className={`btn ${!value ? "btn-navy" : "btn-ghost"}`}>なし</button>
      </div>
    </div>
  );
}
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// 募集人数: 総数 / 男 / 女 — số nguyên, 男+女 ≤ 総数 (tự kẹp). Dễ thống kê.
function RecruitCount({
  total, male, female, onChange,
}: {
  total: number | "";
  male: number | "";
  female: number | "";
  onChange: (total: number | "", male: number | "", female: number | "") => void;
}) {
  const T = total === "" ? 0 : total;
  const M = male === "" ? 0 : male;
  const F = female === "" ? 0 : female;
  const parse = (v: string): number | "" => (v === "" ? "" : Math.max(0, Math.floor(Number(v) || 0)));

  function onTotal(v: string) {
    const t = parse(v);
    const tn = t === "" ? 0 : t;
    let m: number | "" = male, f: number | "" = female;
    if (M + F > tn) { f = Math.max(0, tn - M); if (M > tn) { m = tn; f = 0; } }
    onChange(t, m, f);
  }
  function onMale(v: string) {
    const raw = parse(v);
    onChange(total, raw === "" ? "" : Math.min(raw, Math.max(0, T - F)), female);
  }
  function onFemale(v: string) {
    const raw = parse(v);
    onChange(total, male, raw === "" ? "" : Math.min(raw, Math.max(0, T - M)));
  }
  const remaining = T - M - F;

  const Cell = ({ label, value, on, max }: { label: string; value: number | ""; on: (v: string) => void; max?: number }) => (
    <div>
      <div className="mb-1 text-xs font-semibold text-slate-500">{label}</div>
      <div className="flex items-center gap-1.5">
        <input type="number" inputMode="numeric" min={0} max={max} value={value} onChange={(e) => on(e.target.value)}
          onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
          className="input text-center font-bold" placeholder="0" />
        <span className="text-sm font-bold text-slate-500">名</span>
      </div>
    </div>
  );

  return (
    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-bold text-ink">募集人数</span>
        <span className="rounded bg-bl-redsoft px-1.5 py-0.5 text-[10px] font-bold text-bl-red">数字のみ</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Cell label="総募集人数" value={total} on={onTotal} />
        <Cell label="男" value={male} on={onMale} max={T - F} />
        <Cell label="女" value={female} on={onFemale} max={T - M} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        男＋女は総数（{T}名）を超えられません。
        {remaining > 0 ? <span className="ml-1 font-semibold text-bl-amber">未指定 {remaining}名</span>
          : remaining === 0 && T > 0 ? <span className="ml-1 font-semibold text-bl-green">男女の内訳が一致しています</span> : null}
      </p>
    </div>
  );
}

const TABS = [
  "基本情報",
  "仕事内容",
  "給与・待遇",
  "勤務条件",
  "寮・生活",
  "公開用メモ",
  "社内メモ",
  "社内・CTV報酬",
];

export function JobForm({
  mode,
  initial,
  companies,
  ctvs,
  canInternal,
  seeCommission,
  jobId,
}: {
  mode: "create" | "edit";
  initial: Record<string, unknown>;
  companies: Opt[];
  ctvs: Opt[];
  canInternal: boolean;
  seeCommission: boolean;
  jobId?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState<Record<string, unknown>>({
    companyId: companies[0]?.id ?? "",
    residenceType: "TOKUTEI_1",
    publicStatus: "DRAFT",
    genderCondition: "ANY",
    ...initial,
  });
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const s = (k: string) => (f[k] as string) ?? "";
  const n = (k: string) => (f[k] === undefined || f[k] === null ? "" : (f[k] as number));
  const b = (k: string) => !!f[k];

  // hide tabs the user can't see
  const visibleTabs = TABS.filter((_, i) => {
    if (i === 6) return canInternal;
    if (i === 7) return seeCommission;
    return true;
  });

  async function save() {
    setErr("");
    setSaving(true);
    const res = await fetch(mode === "create" ? "/api/jobs" : `/api/jobs/${jobId}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/jobs");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "保存に失敗しました");
    }
  }

  return (
    <div className="card">
      {/* tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2">
        {visibleTabs.map((t) => {
          const i = TABS.indexOf(t);
          return (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === i ? "bg-navy text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        {tab === 0 && (
          <>
            <RecruitCount
              total={n("recruitCount")}
              male={n("recruitMale")}
              female={n("recruitFemale")}
              onChange={(t, m, fe) => setF((p) => ({ ...p, recruitCount: t, recruitMale: m, recruitFemale: fe }))}
            />
            <Text label="求人タイトル" value={s("title")} onChange={(v) => set("title", v)} />
            <Select label="企業" value={s("companyId")} onChange={(v) => set("companyId", v)} options={companies.map((c) => [c.id, c.name])} />
            <Text label="職種" value={s("jobTypeName")} onChange={(v) => set("jobTypeName", v)} />
            <Text label="勤務地（都道府県）" value={s("location")} onChange={(v) => set("location", v)} />
            <Text label="市区町村" value={s("city")} onChange={(v) => set("city", v)} />
            <Num label="採用人数" value={n("hiredCount")} onChange={(v) => set("hiredCount", v)} />
            <Text label="雇用形態" value={s("employmentType")} onChange={(v) => set("employmentType", v)} />
            <Select label="在留資格区分" value={s("residenceType")} onChange={(v) => set("residenceType", v)} options={Object.entries(RESIDENCE_LABEL)} />
            <Select label="公開ステータス" value={s("publicStatus")} onChange={(v) => set("publicStatus", v)} options={Object.entries(PUBLIC_STATUS_LABEL)} />
          </>
        )}
        {tab === 1 && (
          <>
            <Area label="仕事内容" value={s("description")} onChange={(v) => set("description", v)} />
            <Area label="一日の流れ" value={s("dailyFlow")} onChange={(v) => set("dailyFlow", v)} />
            <Area label="必要な経験" value={s("requiredExperience")} onChange={(v) => set("requiredExperience", v)} />
            <Area label="必要な資格" value={s("requiredQualification")} onChange={(v) => set("requiredQualification", v)} />
            <Text label="日本語レベル" value={s("japaneseLevel")} onChange={(v) => set("japaneseLevel", v)} />
            <Select label="性別条件" value={s("genderCondition")} onChange={(v) => set("genderCondition", v)} options={Object.entries(GENDER_LABEL)} />
            <Num label="年齢（下限）" value={n("ageMin")} onChange={(v) => set("ageMin", v)} />
            <Num label="年齢（上限）" value={n("ageMax")} onChange={(v) => set("ageMax", v)} />
            <Text label="国籍条件" value={s("nationalityCondition")} onChange={(v) => set("nationalityCondition", v)} />
          </>
        )}
        {tab === 2 && (
          <>
            <Num label="基本給" value={n("baseSalary")} onChange={(v) => set("baseSalary", v)} />
            <Num label="想定月収" value={n("expectedMonthly")} onChange={(v) => set("expectedMonthly", v)} />
            <Num label="想定手取り" value={n("expectedTakeHome")} onChange={(v) => set("expectedTakeHome", v)} />
            <Num label="給与（下限）" value={n("salaryMin")} onChange={(v) => set("salaryMin", v)} />
            <Num label="給与（上限）" value={n("salaryMax")} onChange={(v) => set("salaryMax", v)} />
            <Text label="残業時間" value={s("overtimeHours")} onChange={(v) => set("overtimeHours", v)} />
            <Text label="賞与" value={s("bonus")} onChange={(v) => set("bonus", v)} />
            <Text label="昇給" value={s("raise")} onChange={(v) => set("raise", v)} />
            <Text label="社会保険" value={s("socialInsurance")} onChange={(v) => set("socialInsurance", v)} />
            <Text label="交通費" value={s("transportAllowance")} onChange={(v) => set("transportAllowance", v)} />
            <Text label="休日" value={s("holidays")} onChange={(v) => set("holidays", v)} />
            <Text label="有給" value={s("paidLeave")} onChange={(v) => set("paidLeave", v)} />
          </>
        )}
        {tab === 3 && (
          <>
            <Text label="勤務時間" value={s("workHours")} onChange={(v) => set("workHours", v)} />
            <Toggle label="夜勤" value={b("nightShift")} onChange={(v) => set("nightShift", v)} />
            <Toggle label="シフト制" value={b("shiftWork")} onChange={(v) => set("shiftWork", v)} />
            <Toggle label="交替勤務" value={b("alternatingShift")} onChange={(v) => set("alternatingShift", v)} />
            <Toggle label="残業" value={b("hasOvertime")} onChange={(v) => set("hasOvertime", v)} />
            <DateInput label="入社予定日" value={s("startDate")} onChange={(v) => set("startDate", v)} />
          </>
        )}
        {tab === 4 && (
          <>
            <Toggle label="寮" value={b("dormitoryAvailable")} onChange={(v) => set("dormitoryAvailable", v)} />
            <Num label="寮費" value={n("dormitoryFee")} onChange={(v) => set("dormitoryFee", v)} />
            <Text label="水道光熱費" value={s("utilitiesCost")} onChange={(v) => set("utilitiesCost", v)} />
            <Text label="Wi-Fi" value={s("wifi")} onChange={(v) => set("wifi", v)} />
            <Text label="通勤方法" value={s("commuteMethod")} onChange={(v) => set("commuteMethod", v)} />
            <Text label="駅からの距離" value={s("stationDistance")} onChange={(v) => set("stationDistance", v)} />
            <Toggle label="自転車貸与" value={b("bicycleLease")} onChange={(v) => set("bicycleLease", v)} />
            <Toggle label="送迎" value={b("pickupService")} onChange={(v) => set("pickupService", v)} />
          </>
        )}
        {tab === 5 && (
          <>
            <Area label="公開用メモ（応募者が見る）" value={s("publicMemo")} onChange={(v) => set("publicMemo", v)} />
            <Area label="仕事の魅力（アピールポイント）" value={s("appealPoints")} onChange={(v) => set("appealPoints", v)} />
            <Area label="応募時の注意" value={s("applyNotes")} onChange={(v) => set("applyNotes", v)} />
          </>
        )}
        {tab === 6 && canInternal && (
          <>
            <div className="md:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              ⚠ 社内専用：企業・応募者には表示されません
            </div>
            <Area label="社内メモ" value={s("internalMemo")} onChange={(v) => set("internalMemo", v)} />
            <Area label="会社との交渉履歴" value={s("companyHistory")} onChange={(v) => set("companyHistory", v)} />
            <Area label="求人のリスク" value={s("riskNotes")} onChange={(v) => set("riskNotes", v)} />
          </>
        )}
        {tab === 7 && seeCommission && (
          <>
            <div className="md:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              ⚠ 報酬情報：Super Admin / BIGLIGHT Staff / 担当CTV のみ。企業・応募者には絶対に表示・送信されません。
            </div>
            <Num label="報酬金額" value={n("commAmount")} onChange={(v) => set("commAmount", v)} />
            <Select label="報酬タイプ" value={s("commRewardType") || "FIXED"} onChange={(v) => set("commRewardType", v)} options={Object.entries(REWARD_TYPE_LABEL)} />
            <Select label="支払いタイミング" value={s("commTiming") || "AFTER_JOIN"} onChange={(v) => set("commTiming", v)} options={Object.entries(PAYMENT_TIMING_LABEL)} />
            <Text label="支払い条件" value={s("commCondition")} onChange={(v) => set("commCondition", v)} />
            <Text label="保証期間" value={s("commGuarantee")} onChange={(v) => set("commGuarantee", v)} />
            <Text label="返金規定" value={s("commRefund")} onChange={(v) => set("commRefund", v)} />
            <Select label="CTV担当者" value={s("ctvId")} onChange={(v) => set("ctvId", v)} options={[["", "未割当"], ...ctvs.map((c) => [c.id, c.name] as [string, string])]} />
            <Select label="支払いステータス" value={s("commStatus") || "NOT_YET"} onChange={(v) => set("commStatus", v)} options={Object.entries(PAYMENT_STATUS_LABEL)} />
            <DateInput label="支払予定日" value={s("commScheduled")} onChange={(v) => set("commScheduled", v)} />
            <DateInput label="支払日" value={s("commPaid")} onChange={(v) => set("commPaid", v)} />
            <p className="md:col-span-2 text-xs text-slate-400">
              ※ 報酬の保存は専用の報酬APIで行います（MVP: フィールドは表示のみ）。
            </p>
          </>
        )}
      </div>

      {err && <p className="px-5 text-sm font-semibold text-red-600">{err}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
        <button className="btn btn-ghost" onClick={() => router.push("/admin/jobs")}>キャンセル</button>
        <button className="btn btn-navy" onClick={save} disabled={saving}>
          {saving ? "保存中..." : mode === "create" ? "求人を作成" : "変更を保存"}
        </button>
      </div>
    </div>
  );
}
