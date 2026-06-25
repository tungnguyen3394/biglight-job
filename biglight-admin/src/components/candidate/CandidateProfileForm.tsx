"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NATIONALITIES, VISA_TYPES, JP_LEVELS, SKILL_FIELDS } from "@/lib/candidateFields";
import { PREFECTURES } from "@/lib/prefectures";

export type ProfileInit = {
  name: string;
  birthdate: string;
  gender: string;
  nationality: string;
  visaType: string;
  currentTokuteiField: string;
  visaExpiryDate: string;
  japaneseLevel: string;
  desiredSalaryMan: number;
  desiredIndustry: string[];
  desiredLocation: string[];
  wantDormitory: boolean;
  canNightShift: boolean;
  canShiftWork: boolean;
  changeReason: string;
};

function Card({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-base font-black">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bl-red text-xs text-white">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-bold text-ink">{label}</label>
      {children}
    </div>
  );
}
function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(value === o ? "" : o)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${value === o ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray hover:border-bl-red"}`}>{o}</button>
      ))}
    </div>
  );
}
function MultiChips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => toggle(o)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${value.includes(o) ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray hover:border-bl-red"}`}>{o}</button>
      ))}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${checked ? "border-bl-red bg-bl-redsoft text-bl-red" : "border-bl-line bg-white text-bl-gray"}`}>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${checked ? "border-bl-red bg-bl-red text-white" : "border-bl-line"}`}>{checked ? "✓" : ""}</span>
      {label}
    </button>
  );
}

export default function CandidateProfileForm({ init }: { init: ProfileInit }) {
  const router = useRouter();
  const [f, setF] = useState<ProfileInit>(init);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof ProfileInit>(k: K, v: ProfileInit[K]) => { setF((p) => ({ ...p, [k]: v })); setSaved(false); };

  const pct = useMemo(() => {
    const checks = [!!f.name, !!f.birthdate, f.gender !== "ANY" && !!f.gender, !!f.nationality, !!f.visaType, !!f.japaneseLevel, f.desiredIndustry.length > 0, f.desiredLocation.length > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [f]);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/candidate/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, desiredSalary: f.desiredSalaryMan ? f.desiredSalaryMan * 10000 : null }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); router.refresh(); }
  }

  return (
    <div className="space-y-4">
      {/* Completion */}
      <div className="rounded-2xl border border-bl-line bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <b>プロフィール完成度</b>
          <span className="font-black text-bl-red">{pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-bl-bg">
          <div className="h-full rounded-full bg-bl-red transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-bl-gray">{pct < 100 ? "入力するほど、あなたに合う求人が見つかりやすくなります。" : "入力ありがとうございます！担当者があなたに合う求人をご紹介します。"}</p>
      </div>

      <Card n={1} title="基本情報">
        <Field label="お名前（ローマ字）"><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="NGUYEN VAN A" className="w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm outline-none focus:border-bl-red" /></Field>
        <Field label="生年月日"><input type="date" value={f.birthdate} onChange={(e) => set("birthdate", e.target.value)} className="w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm outline-none focus:border-bl-red" /></Field>
        <Field label="性別"><Chips options={["男性", "女性"]} value={f.gender === "MALE" ? "男性" : f.gender === "FEMALE" ? "女性" : ""} onChange={(v) => set("gender", v === "男性" ? "MALE" : v === "女性" ? "FEMALE" : "ANY")} /></Field>
        <Field label="国籍"><select value={f.nationality} onChange={(e) => set("nationality", e.target.value)} className="w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm"><option value="">選択してください</option>{NATIONALITIES.map((n) => <option key={n}>{n}</option>)}</select></Field>
      </Card>

      <Card n={2} title="在留資格（ビザ）">
        <Field label="現在の在留資格"><Chips options={VISA_TYPES} value={f.visaType} onChange={(v) => set("visaType", v)} /></Field>
        <Field label="現在の職種（特定技能分野）"><select value={f.currentTokuteiField} onChange={(e) => set("currentTokuteiField", e.target.value)} className="w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm"><option value="">選択してください</option>{SKILL_FIELDS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="在留期限"><input type="date" value={f.visaExpiryDate} onChange={(e) => set("visaExpiryDate", e.target.value)} className="w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm outline-none focus:border-bl-red" /></Field>
        <Field label="日本語レベル"><Chips options={JP_LEVELS} value={f.japaneseLevel} onChange={(v) => set("japaneseLevel", v)} /></Field>
      </Card>

      <Card n={3} title="希望する仕事">
        <Field label={`希望月給（手取り）：${f.desiredSalaryMan}万円`}>
          <input type="range" min={16} max={40} value={f.desiredSalaryMan} onChange={(e) => set("desiredSalaryMan", Number(e.target.value))} className="w-full accent-bl-red" />
        </Field>
        <Field label="希望する特定技能分野"><MultiChips options={SKILL_FIELDS} value={f.desiredIndustry} onChange={(v) => set("desiredIndustry", v)} /></Field>
        <Field label="希望勤務地"><MultiChips options={PREFECTURES} value={f.desiredLocation} onChange={(v) => set("desiredLocation", v)} /></Field>
        <Field label="働き方の希望">
          <div className="flex flex-wrap gap-2">
            <Toggle label="寮を希望" checked={f.wantDormitory} onChange={(v) => set("wantDormitory", v)} />
            <Toggle label="夜勤できる" checked={f.canNightShift} onChange={(v) => set("canNightShift", v)} />
            <Toggle label="交替勤務できる" checked={f.canShiftWork} onChange={(v) => set("canShiftWork", v)} />
          </div>
        </Field>
        <Field label="転職理由・希望する働き方（自由入力）"><textarea value={f.changeReason} onChange={(e) => set("changeReason", e.target.value)} rows={3} className="w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm outline-none focus:border-bl-red" /></Field>
      </Card>

      {/* Save */}
      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <button onClick={save} disabled={saving} className="w-full rounded-xl bg-bl-red py-3.5 text-base font-bold text-white shadow-lg hover:bg-bl-redd disabled:opacity-60">
          {saving ? "保存中…" : saved ? "✓ 保存しました" : "プロフィールを保存する"}
        </button>
      </div>
    </div>
  );
}
