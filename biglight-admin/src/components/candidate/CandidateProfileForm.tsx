"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NATIONALITIES, VISA_TYPES, JP_LEVELS, SKILL_FIELDS, PREF_OPTIONS,
  DORM_OPTIONS, START_OPTIONS, NIGHTSHIFT_OPTIONS, SHIFTWORK_OPTIONS,
  REASONS, PRIORITIES, WEIGHT,
} from "@/lib/candidateFields";
import { SSW_JOBS } from "@/lib/sswJobs";

export type ProfileInit = {
  name: string; birth: string; gender: string; nat: string;
  visa: string; expiry: string; arrival: string; jp: string;
  sswField: string; sswCategory: string; sswTask: string; otherSkills: string;
  fields: string[]; areas: string[]; sal: number;
  dorm: string; start: string; nightshift: string; shiftwork: string;
  reasons: string[]; reasonOther: string; priorities: string[];
};

const PROFILE_KEYS = Object.keys(WEIGHT).filter((k) => k !== "docs");
const TOTAL_WEIGHT = PROFILE_KEYS.reduce((a, k) => a + WEIGHT[k], 0);

function Card({ n, title, sub, children }: { n: number; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-black"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-bl-red text-xs text-white">{n}</span>{title}</h3>
      {sub && <p className="mb-3 ml-8 mt-1 text-xs text-bl-gray">{sub}</p>}
      <div className={sub ? "" : "mt-4"}>{children}</div>
    </section>
  );
}
function Field({ label, opt, children }: { label: string; opt?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ink">{label}{opt && <span className="rounded bg-bl-bg px-1.5 py-0.5 text-[10px] font-bold text-bl-gray2">任意</span>}</label>
      {children}
    </div>
  );
}
function chipCls(on: boolean) {
  return `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray hover:border-bl-red"}`;
}
function One({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return <div className="flex flex-wrap gap-1.5">{options.map((o) => <button key={o} type="button" onClick={() => onChange(value === o ? "" : o)} className={chipCls(value === o)}>{o}</button>)}</div>;
}
function Many({ options, value, onChange, max, scroll }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number; scroll?: boolean }) {
  const toggle = (o: string) => {
    if (value.includes(o)) onChange(value.filter((x) => x !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  };
  return <div className={`flex flex-wrap gap-1.5 ${scroll ? "max-h-44 overflow-y-auto" : ""}`}>{options.map((o) => <button key={o} type="button" onClick={() => toggle(o)} className={chipCls(value.includes(o))}>{o}</button>)}</div>;
}
const inputCls = "w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm outline-none focus:border-bl-red";

export default function CandidateProfileForm({ init }: { init: ProfileInit }) {
  const router = useRouter();
  const [f, setF] = useState<ProfileInit>(init);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof ProfileInit>(k: K, v: ProfileInit[K]) => { setF((p) => ({ ...p, [k]: v })); setSaved(false); };
  const setSsw = (field: string, cat: string, task: string) => { setF((p) => ({ ...p, sswField: field, sswCategory: cat, sswTask: task })); setSaved(false); };
  const sswCats = SSW_JOBS.find((d) => d.field === f.sswField)?.categories ?? [];
  const sswTasks = sswCats.find((c) => c.category === f.sswCategory)?.mainTasks ?? [];

  const pct = useMemo(() => {
    const filled = (k: string): boolean => {
      if (k === "gender") return f.gender === "MALE" || f.gender === "FEMALE";
      if (k === "cur") return !!f.sswField;
      const v = (f as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v.length > 0;
      if (k === "sal") return (v as number) > 0;
      return String(v ?? "").trim() !== "";
    };
    let s = 0;
    for (const k of PROFILE_KEYS) if (filled(k)) s += WEIGHT[k];
    return Math.round((s / TOTAL_WEIGHT) * 100);
  }, [f]);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/candidate/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, desiredSalary: f.sal ? f.sal * 10000 : null }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); router.refresh(); }
  }

  const genderJP = f.gender === "MALE" ? "男性" : f.gender === "FEMALE" ? "女性" : "";

  return (
    <div className="space-y-4">
      {/* Completion */}
      <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm"><b>プロフィール完成度</b><span className="font-black text-bl-red">{pct}%</span></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-bl-bg"><div className="h-full rounded-full bg-bl-red transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-xs text-bl-gray">{pct < 100 ? "入力するほど、あなたに合う求人が見つかりやすくなります。" : "入力ありがとうございます！担当者があなたに合う求人をご紹介します。"}</p>
      </div>

      <Card n={1} title="基本情報">
        <Field label="お名前（ローマ字）"><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="NGUYEN VAN A" className={inputCls} /></Field>
        <Field label="生年月日"><input type="date" value={f.birth} onChange={(e) => set("birth", e.target.value)} className={inputCls} /></Field>
        <Field label="性別"><One options={["男性", "女性"]} value={genderJP} onChange={(v) => set("gender", v === "男性" ? "MALE" : v === "女性" ? "FEMALE" : "ANY")} /></Field>
        <Field label="国籍"><select value={f.nat} onChange={(e) => set("nat", e.target.value)} className={inputCls}><option value="">選択してください</option>{NATIONALITIES.map((n) => <option key={n}>{n}</option>)}</select></Field>
      </Card>

      <Card n={2} title="在留資格（ビザ）">
        <Field label="現在の在留資格"><One options={VISA_TYPES} value={f.visa} onChange={(v) => set("visa", v)} /></Field>
        <Field label="現在の職種（特定技能分野）" opt>
          <div className="space-y-2">
            <select value={f.sswField} onChange={(e) => setSsw(e.target.value, "", "")} className={inputCls}>
              <option value="">① 特定技能分野を選択</option>
              {SSW_JOBS.map((d) => <option key={d.field}>{d.field}</option>)}
            </select>
            <select value={f.sswCategory} onChange={(e) => setSsw(f.sswField, e.target.value, "")} disabled={sswCats.length === 0} className={`${inputCls} disabled:bg-bl-bg disabled:text-bl-gray2`}>
              <option value="">② 業務区分を選択</option>
              {sswCats.map((c) => <option key={c.category}>{c.category}</option>)}
            </select>
            <select value={f.sswTask} onChange={(e) => setSsw(f.sswField, f.sswCategory, e.target.value)} disabled={sswTasks.length === 0} className={`${inputCls} disabled:bg-bl-bg disabled:text-bl-gray2`}>
              <option value="">③ 従事する主な業務を選択</option>
              {sswTasks.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </Field>
        <Field label="その他の経験・スキル" opt>
          <textarea value={f.otherSkills} onChange={(e) => set("otherSkills", e.target.value)} rows={2} placeholder="例：フォークリフト免許、溶接3年 など" className={inputCls} />
        </Field>
        <Field label="在留期限" opt><input type="date" value={f.expiry} onChange={(e) => set("expiry", e.target.value)} className={inputCls} /></Field>
        <Field label="来日年月日" opt><input type="date" value={f.arrival} onChange={(e) => set("arrival", e.target.value)} className={inputCls} /></Field>
        <Field label="日本語レベル"><One options={JP_LEVELS} value={f.jp} onChange={(v) => set("jp", v)} /></Field>
      </Card>

      <Card n={3} title="希望する仕事">
        <Field label={`希望月給（手取り）：${f.sal || 16}万円`} opt><input type="range" min={16} max={40} value={f.sal || 16} onChange={(e) => set("sal", Number(e.target.value))} className="w-full accent-bl-red" /></Field>
        <Field label="希望する特定技能分野"><Many options={SKILL_FIELDS} value={f.fields} onChange={(v) => set("fields", v)} /></Field>
        <Field label="希望勤務地"><Many options={PREF_OPTIONS} value={f.areas} onChange={(v) => set("areas", v)} scroll /></Field>
        <Field label="寮の希望" opt><One options={DORM_OPTIONS} value={f.dorm} onChange={(v) => set("dorm", v)} /></Field>
        <Field label="いつから働けますか" opt><One options={START_OPTIONS} value={f.start} onChange={(v) => set("start", v)} /></Field>
        <Field label="夜勤できますか" opt><One options={NIGHTSHIFT_OPTIONS} value={f.nightshift} onChange={(v) => set("nightshift", v)} /></Field>
        <Field label="交替勤務できますか" opt><One options={SHIFTWORK_OPTIONS} value={f.shiftwork} onChange={(v) => set("shiftwork", v)} /></Field>
        <Field label="転職理由・希望する働き方" opt>
          <Many options={REASONS} value={f.reasons} onChange={(v) => set("reasons", v)} scroll />
          {f.reasons.includes("その他（自由入力）") && (
            <textarea value={f.reasonOther} onChange={(e) => set("reasonOther", e.target.value)} rows={2} placeholder="その他の理由を入力" className={`${inputCls} mt-2`} />
          )}
        </Field>
        <Field label="最も重視すること（3つまで）" opt><Many options={PRIORITIES} value={f.priorities} onChange={(v) => set("priorities", v)} max={3} /></Field>
      </Card>

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <button onClick={save} disabled={saving} className="w-full rounded-xl bg-bl-red py-3.5 text-base font-bold text-white shadow-lg hover:bg-bl-redd disabled:opacity-60">
          {saving ? "保存中…" : saved ? "✓ 保存しました" : "プロフィールを保存する"}
        </button>
      </div>
    </div>
  );
}
