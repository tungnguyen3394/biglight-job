"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  NATIONALITIES, VISA_TYPES, JP_LEVELS, SKILL_FIELDS, PREF_OPTIONS,
  DORM_OPTIONS, START_OPTIONS, NIGHTSHIFT_OPTIONS, SHIFTWORK_OPTIONS,
  REASONS, PRIORITIES, WEIGHT,
} from "@/lib/candidateFields";
import { SSW_JOBS, type SswField } from "@/lib/sswJobs";
import CandidateDocuments, { type DocMap } from "./CandidateDocuments";
import MultiUpload, { type DocFile } from "./MultiUpload";

// 1 dòng 職歴・業務経験 (dùng cho CV/PDF).
export type WorkItem = { start: string; end: string; company: string; work: string };

export type ProfileInit = {
  name: string; kana: string; birth: string; gender: string; nat: string; phone: string; email: string;
  address: string; addressDetail: string; facebookUrl: string; instagramUrl: string; tiktokUrl: string;
  visa: string; expiry: string; arrival: string; jp: string;
  sswField: string; sswCategory: string; sswTask: string;
  workHistory: WorkItem[];
  fields: string[]; areas: string[]; desiredJobType: string; sal: number;
  dorm: string; start: string; nightshift: string; shiftwork: string;
  reasons: string[]; reasonOther: string; priorities: string[];
};

// 47 都道府県（現在の住所の選択肢）
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const PROFILE_KEYS = Object.keys(WEIGHT);
const TOTAL_WEIGHT = PROFILE_KEYS.reduce((a, k) => a + WEIGHT[k], 0);

const inputCls = "w-full rounded-xl border border-bl-line px-3 py-2.5 text-sm outline-none focus:border-bl-red disabled:bg-bl-bg disabled:text-bl-gray2";

// Mở lịch native khi chạm vào ô ngày (icon lịch không phải lúc nào cũng tự mở trên mobile).
function openPicker(e: React.MouseEvent<HTMLInputElement>) {
  try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// SNS アカウント — Facebook / Instagram / TikTok
// ---------------------------------------------------------------------------
type SnsKey = "facebook" | "instagram" | "tiktok";
type SnsField = "facebookUrl" | "instagramUrl" | "tiktokUrl";

const SNS_CONF: Record<SnsKey, { label: string; domain: string; placeholder: string; field: SnsField; icon: React.ReactNode }> = {
  facebook: {
    label: "Facebook", domain: "facebook.com", placeholder: "facebook.com/yourname", field: "facebookUrl",
    icon: <path d="M15 8h-2a1 1 0 0 0-1 1v2h3l-.5 3H12v7M9 11h3" />,
  },
  instagram: {
    label: "Instagram", domain: "instagram.com", placeholder: "instagram.com/yourname", field: "instagramUrl",
    icon: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></>,
  },
  tiktok: {
    label: "TikTok", domain: "tiktok.com", placeholder: "tiktok.com/@yourname", field: "tiktokUrl",
    icon: <><path d="M9 12a3 3 0 1 0 3 3V4c.5 2.5 2 3.8 4 4" /></>,
  },
};
const SNS_KEYS: SnsKey[] = ["facebook", "instagram", "tiktok"];

// Chuẩn hóa + validate nới nhẹ: đúng domain + có username; tự thêm https, bỏ www / "/" cuối.
function normalizeSnsUrl(key: SnsKey, raw: string): { ok: true; url: string } | { ok: false } {
  const conf = SNS_CONF[key];
  let s = raw.trim();
  if (!s) return { ok: false };
  s = s.replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(s)) s = "https://" + s;
  let u: URL;
  try { u = new URL(s); } catch { return { ok: false }; }
  const host = u.host.toLowerCase().replace(/^www\./, "");
  if (host !== conf.domain) return { ok: false };           // sai domain / chỉ là chuỗi lạ
  const path = u.pathname.replace(/\/+$/, "");
  if (!path) return { ok: false };                          // chỉ có domain, không username
  return { ok: true, url: `https://${conf.domain}${path}` };
}

const IconHelp = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4 2c0 1.5-2 1.8-2 3M12 17h.01" /></svg>);
const IconEdit = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>);
const IconTrash = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>);

const HELP_STEPS: Record<SnsKey, string[]> = {
  facebook: ["プロフィール画面を開く", "「・・・」または共有ボタンをタップ", "「リンクをコピー」を選ぶ", "ここに貼り付けて「追加」"],
  instagram: ["自分のプロフィールを開く", "右上のメニュー（≡）→「プロフィールをシェア」", "「リンクをコピー」を選ぶ", "ここに貼り付けて「追加」"],
  tiktok: ["自分のプロフィールを開く", "右上の共有ボタンをタップ", "「リンクをコピー」を選ぶ", "ここに貼り付けて「追加」"],
};

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-black text-ink">SNSリンクのコピー方法</h3>
          <button onClick={onClose} className="text-bl-gray2 hover:text-ink"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-4">
          {SNS_KEYS.map((k) => (
            <div key={k} className="rounded-xl border border-bl-line p-3.5">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{SNS_CONF[k].icon}</svg>
                {SNS_CONF[k].label}
              </div>
              <ol className="ml-1 list-inside list-decimal space-y-1 text-xs text-bl-gray">
                {HELP_STEPS[k].map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              {/* Ảnh hướng dẫn — tự ẩn nếu chưa đặt file vào /public/help/ */}
              <img
                src={`/help/${k}.png`} alt=""
                className="mt-2 w-full rounded-lg border border-bl-line"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ))}
          <p className="rounded-lg bg-bl-bg px-3 py-2 text-xs text-bl-gray">例）<b>facebook.com/yourname</b> のように、プロフィールのURLを貼り付けてください。投稿・リール・ストーリーのリンクではなく、ご自身のプロフィールのリンクをご利用ください。</p>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-bl-red py-2.5 text-sm font-bold text-white">閉じる</button>
      </div>
    </div>
  );
}

function SnsEditor({ values, onChange }: { values: Record<SnsField, string>; onChange: (field: SnsField, url: string) => void }) {
  const added = SNS_KEYS.filter((k) => values[SNS_CONF[k].field]);
  const firstFree = SNS_KEYS.find((k) => !values[SNS_CONF[k].field]) ?? "facebook";
  const [platform, setPlatform] = useState<SnsKey>(firstFree);
  const [url, setUrl] = useState("");
  const [editingKey, setEditingKey] = useState<SnsKey | null>(null);
  const [err, setErr] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const available = SNS_KEYS.filter((k) => !values[SNS_CONF[k].field] || k === editingKey);
  const showForm = available.length > 0;

  function submit() {
    setErr("");
    const conf = SNS_CONF[platform];
    const res = normalizeSnsUrl(platform, url);
    if (!res.ok) { setErr(`${conf.label}プロフィールURLを入力してください。`); return; }
    const dup = SNS_KEYS.some((k) => k !== platform && values[SNS_CONF[k].field] === res.url);
    if (dup) { setErr("このSNSはすでに登録されています。"); return; }
    onChange(conf.field, res.url);
    setUrl(""); setErr(""); setEditingKey(null);
    const next = SNS_KEYS.find((k) => k !== platform && !values[SNS_CONF[k].field]);
    if (next) setPlatform(next);
  }
  function edit(k: SnsKey) { setEditingKey(k); setPlatform(k); setUrl(values[SNS_CONF[k].field]); setErr(""); }
  function remove(k: SnsKey) { onChange(SNS_CONF[k].field, ""); if (editingKey === k) { setEditingKey(null); setUrl(""); } if (!values[SNS_CONF[platform].field]) setPlatform(k); }

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-bold text-ink">SNSアカウント</span>
        <span className="rounded bg-bl-redsoft px-1.5 py-0.5 text-[10px] font-bold text-bl-red">必須</span>
        <button type="button" onClick={() => setShowHelp(true)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-bl-line px-2 py-1 text-xs font-semibold text-bl-gray hover:border-bl-red hover:text-bl-red">
          <IconHelp /> 使い方
        </button>
      </div>

      {/* Cards các SNS đã thêm */}
      {added.length > 0 && (
        <div className="mb-2 space-y-2">
          {added.map((k) => {
            const conf = SNS_CONF[k];
            return (
              <div key={k} className="flex items-center gap-3 rounded-xl border border-bl-line bg-white p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bl-bg text-bl-gray">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{conf.icon}</svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink">{conf.label}</div>
                  <a href={values[conf.field]} target="_blank" rel="noreferrer" className="block truncate text-xs text-bl-blue hover:underline">{values[conf.field]}</a>
                </div>
                <button type="button" onClick={() => edit(k)} className="inline-flex items-center gap-1 rounded-lg border border-bl-line px-2 py-1 text-xs font-semibold text-bl-gray hover:border-bl-red hover:text-bl-red"><IconEdit /> 編集</button>
                <button type="button" onClick={() => remove(k)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-bl-red hover:bg-bl-redsoft"><IconTrash /> 削除</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Hàng thêm: [SNS ▼] [URL] [追加] */}
      {showForm && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={platform}
              disabled={!!editingKey}
              onChange={(e) => { setPlatform(e.target.value as SnsKey); setErr(""); }}
              className={`${inputCls} sm:w-36`}
            >
              {available.map((k) => <option key={k} value={k}>{SNS_CONF[k].label}</option>)}
            </select>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder={SNS_CONF[platform].placeholder}
              className={`${inputCls} flex-1`}
            />
            <button type="button" onClick={submit} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
              {editingKey ? "更新" : "追加"}
            </button>
          </div>
          {err && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-bl-red">{err}</p>
              <button type="button" onClick={() => setShowHelp(true)} className="text-xs font-semibold text-bl-blue underline">URLのコピー方法を見る</button>
            </div>
          )}
        </>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Card({ n, title, sub, children }: { n: number; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-bl-line bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-[17px] font-black text-ink"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-bl-bg text-xs font-bold text-bl-gray2">{n}</span>{title}</h3>
      {sub && <p className="mb-3 ml-8 mt-1 text-xs text-bl-gray">{sub}</p>}
      <div className={sub ? "" : "mt-4"}>{children}</div>
    </section>
  );
}
function Field({ label, opt, req, children }: { label: string; opt?: boolean; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ink">{label}{req && <span className="rounded bg-bl-redsoft px-1.5 py-0.5 text-[10px] font-bold text-bl-red">必須</span>}{opt && <span className="rounded bg-bl-bg px-1.5 py-0.5 text-[10px] font-bold text-bl-gray2">任意</span>}</label>
      {children}
    </div>
  );
}
function chipCls(on: boolean) {
  return `rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${on ? "border-bl-red bg-bl-red text-white" : "border-bl-line bg-white text-bl-gray hover:border-bl-red"}`;
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

// ---------------------------------------------------------------------------
// 職歴・業務経験 — nhiều block, mỗi block card dọc (mobile-first).
// ---------------------------------------------------------------------------
function WorkHistory({ items, onChange }: { items: WorkItem[]; onChange: (v: WorkItem[]) => void }) {
  const update = (i: number, key: keyof WorkItem, val: string) => onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  const add = () => onChange([...items, { start: "", end: "", company: "", work: "" }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const subLabel = "mb-1 block text-xs font-bold text-ink";
  const note = "mt-1 text-xs text-bl-gray2";
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-bl-line bg-bl-bg/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-black text-ink">職歴 {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-bl-red hover:bg-bl-redsoft"><IconTrash /> 削除</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={subLabel}>勤務開始年月</label>
              <input type="month" value={it.start} onChange={(e) => update(i, "start", e.target.value)} onClick={openPicker} className={inputCls} />
            </div>
            <div>
              <label className={subLabel}>退職年月</label>
              <input type="month" value={it.end} onChange={(e) => update(i, "end", e.target.value)} onClick={openPicker} className={inputCls} />
            </div>
          </div>
          <div className="mt-3">
            <label className={subLabel}>会社名</label>
            <input value={it.company} onChange={(e) => update(i, "company", e.target.value)} placeholder="株式会社〇〇" className={inputCls} />
            <p className={note}>会社名はできるだけ正式名称・漢字で入力してください。</p>
          </div>
          <div className="mt-3">
            <label className={subLabel}>仕事内容</label>
            <textarea value={it.work} onChange={(e) => update(i, "work", e.target.value)} rows={2} placeholder="溶接、検品、組立など" className={inputCls} />
            <p className={note}>母国語でも入力できます。CV作成時に日本語へ整えます。</p>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-bl-line bg-white py-3 text-sm font-bold text-bl-gray hover:border-bl-red hover:text-bl-red">
        ＋ 職歴を追加
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 履歴書用写真（3cm×4cm）— 1 ảnh, camera + thư viện. Lưu qua slot documents "cvphoto".
// ---------------------------------------------------------------------------
const IconCamera = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
const IconImage = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>);

function CvPhoto({ initFile }: { initFile: DocFile | null }) {
  const [file, setFile] = useState<DocFile | null>(initFile);
  const [busy, setBusy] = useState(false);
  async function upload(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setBusy(true);
    // Chỉ giữ 1 ảnh: xóa ảnh cũ trước khi thêm mới.
    if (file) await fetch("/api/candidate/documents", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot: "cvphoto", file: file.file }) }).catch(() => {});
    const fd = new FormData();
    fd.append("slot", "cvphoto");
    fd.append("file", f);
    const res = await fetch("/api/candidate/documents", { method: "POST", body: fd });
    if (res.ok) { const d = await res.json(); setFile((d.files as DocFile[])[(d.files as DocFile[]).length - 1] ?? null); }
    else alert((await res.json().catch(() => ({}))).error || "アップロードに失敗しました");
    setBusy(false);
  }
  async function remove() {
    if (!file) return;
    const res = await fetch("/api/candidate/documents", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot: "cvphoto", file: file.file }) });
    if (res.ok) setFile(null);
  }
  const btn = "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-bl-line bg-white py-3 text-sm font-semibold text-bl-gray hover:border-bl-red hover:text-bl-red";
  return (
    <div>
      {file ? (
        <div className="flex items-start gap-3">
          <img src={`/api/candidate/documents?slot=cvphoto&file=${encodeURIComponent(file.file)}`} alt="履歴書用写真" className="h-40 w-[120px] rounded-lg border border-bl-line object-cover" />
          <button type="button" onClick={remove} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-bl-red hover:bg-bl-redsoft"><IconTrash /> 削除</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <label className={btn}>
            <input type="file" accept="image/*" capture="user" className="hidden" disabled={busy} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
            <IconCamera /> カメラで撮影
          </label>
          <label className={btn}>
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
            <IconImage /> 画像を選択
          </label>
        </div>
      )}
      {busy && <p className="mt-2 text-xs text-bl-gray2">アップロード中…</p>}
    </div>
  );
}

export type FieldOptions = { nationality?: string[]; visa?: string[]; jpLevel?: string[]; industry?: string[] };

export default function CandidateProfileForm({ init, initDocs, emailLocked, options, sswTree }: { init: ProfileInit; initDocs: DocMap; emailLocked?: boolean; options?: FieldOptions; sswTree?: SswField[] }) {
  const router = useRouter();
  // Định nghĩa từ 設定 (DB); fallback về hằng số gốc nếu chưa có.
  const NAT = options?.nationality ?? NATIONALITIES;
  const VISA = options?.visa ?? VISA_TYPES;
  const JP = options?.jpLevel ?? JP_LEVELS;
  const IND = options?.industry ?? SKILL_FIELDS;
  const SSW = sswTree && sswTree.length ? sswTree : SSW_JOBS;
  const [f, setF] = useState<ProfileInit>(init);
  const [baseline, setBaseline] = useState<ProfileInit>(init);
  const [editing, setEditing] = useState<boolean>(!init.name || !init.phone); // người mới → mở sẵn chế độ sửa
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof ProfileInit>(k: K, v: ProfileInit[K]) => { setF((p) => ({ ...p, [k]: v })); setSaved(false); };
  const setSsw = (field: string, cat: string, task: string) => { setF((p) => ({ ...p, sswField: field, sswCategory: cat, sswTask: task })); setSaved(false); };
  const sswCats = SSW.find((d) => d.field === f.sswField)?.categories ?? [];
  const sswTasks = sswCats.find((c) => c.category === f.sswCategory)?.mainTasks ?? [];

  async function save() {
    setErr("");
    if (!emailLocked && !f.email.trim()) { setErr("メールアドレスを入力してください。"); return; }
    setSaving(true);
    const res = await fetch("/api/candidate/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, desiredSalary: f.sal ? f.sal * 10000 : null }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setBaseline(f); setEditing(false); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error || "保存に失敗しました");
  }
  function cancel() { setF(baseline); setEditing(false); setErr(""); }

  const genderJP = f.gender === "MALE" ? "男性" : f.gender === "FEMALE" ? "女性" : "";

  return (
    <div className="space-y-4">
      {/* fieldset disabled = chế độ xem (khóa nhập); editing = mở khóa */}
      <fieldset disabled={!editing} className="m-0 min-w-0 space-y-4 border-0 p-0">
        <Card n={1} title="基本情報">
          <Field label="お名前（ローマ字）" req><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="NGUYEN VAN A" className={inputCls} /></Field>
          <Field label="フリガナ" opt><input value={f.kana} onChange={(e) => set("kana", e.target.value)} placeholder="グエン ヴァン アー" className={inputCls} /></Field>
          <Field label="生年月日" req><input type="date" value={f.birth} onChange={(e) => set("birth", e.target.value)} onClick={openPicker} className={inputCls} /></Field>
          <Field label="性別" req><One options={["男性", "女性"]} value={genderJP} onChange={(v) => set("gender", v === "男性" ? "MALE" : v === "女性" ? "FEMALE" : "ANY")} /></Field>
          <Field label="国籍" req><select value={f.nat} onChange={(e) => set("nat", e.target.value)} className={inputCls}><option value="">選択してください</option>{NAT.map((n) => <option key={n}>{n}</option>)}</select></Field>
          <Field label="電話番号" opt><input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="090-1234-5678" className={inputCls} /></Field>
          <Field label="メールアドレス" req={!emailLocked}>
            <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} readOnly={emailLocked} placeholder="example@email.com" className={`${inputCls} ${emailLocked ? "bg-bl-bg text-bl-gray2" : ""}`} />
            <p className="mt-1 text-xs text-bl-gray2">{emailLocked ? "ログインアカウントのメールアドレスです（変更不可）。" : "Facebookログインのため、ご連絡用のメールアドレスをご入力ください。"}</p>
          </Field>

          {/* SNSアカウント — ngay dưới メールアドレス */}
          <SnsEditor
            values={{ facebookUrl: f.facebookUrl, instagramUrl: f.instagramUrl, tiktokUrl: f.tiktokUrl }}
            onChange={(field, url) => set(field, url)}
          />

          <Field label="現在の住所（都道府県）" opt>
            <select value={f.address} onChange={(e) => set("address", e.target.value)} className={inputCls}>
              <option value="">選択してください</option>
              {f.address && !PREFECTURES.includes(f.address) && <option value={f.address}>{f.address}（現在の登録）</option>}
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="現在の住所（詳細）" opt>
            <input value={f.addressDetail} onChange={(e) => set("addressDetail", e.target.value)} placeholder="例：名古屋市中区〇〇町1-2-3 〇〇マンション101" className={inputCls} />
          </Field>
        </Card>

        <Card n={2} title="在留資格（ビザ）">
          <Field label="現在の在留資格" req><One options={VISA} value={f.visa} onChange={(v) => set("visa", v)} /></Field>
          <Field label="現在の職種（特定技能分野）" opt>
            <div className="space-y-2">
              <select value={f.sswField} onChange={(e) => setSsw(e.target.value, "", "")} className={inputCls}>
                <option value="">① 特定技能分野を選択</option>
                {SSW.map((d) => <option key={d.field}>{d.field}</option>)}
              </select>
              <select value={f.sswCategory} onChange={(e) => setSsw(f.sswField, e.target.value, "")} disabled={sswCats.length === 0} className={`${inputCls}`}>
                <option value="">② 業務区分を選択</option>
                {sswCats.map((c) => <option key={c.category}>{c.category}</option>)}
              </select>
              <select value={f.sswTask} onChange={(e) => setSsw(f.sswField, f.sswCategory, e.target.value)} disabled={sswTasks.length === 0} className={`${inputCls}`}>
                <option value="">③ 従事する主な業務を選択</option>
                {sswTasks.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </Field>
          <Field label="製品の写真（溶接など）" opt>
            <p className="mb-2 text-xs text-bl-gray2">溶接など、ものづくりの作業をする方は、ご自身が作った製品の写真を添付してください（複数可）。担当者があなたの技術をより正確に伝えられます。</p>
            <MultiUpload slot="workphotos" initFiles={initDocs.workphotos ?? []} accept="image/*" addLabel="＋ 製品の写真を追加（複数可）" preview />
          </Field>
          <Field label="在留期限" opt><input type="date" value={f.expiry} onChange={(e) => set("expiry", e.target.value)} onClick={openPicker} className={inputCls} /></Field>
          <Field label="来日年月日" opt><input type="date" value={f.arrival} onChange={(e) => set("arrival", e.target.value)} onClick={openPicker} className={inputCls} /></Field>
          <Field label="日本語レベル"><One options={JP} value={f.jp} onChange={(v) => set("jp", v)} /></Field>
        </Card>

        <Card n={3} title="職歴・業務経験" sub="これまで働いた会社と仕事内容を入力してください。複数ある場合は追加できます。">
          <WorkHistory items={f.workHistory} onChange={(v) => set("workHistory", v)} />
        </Card>

        <Card n={4} title="履歴書用写真（3cm×4cm）">
          <p className="mb-3 text-xs text-bl-gray2">履歴書に使用する正面写真をアップロードしてください。</p>
          <CvPhoto initFile={initDocs.cvphoto?.[0] ?? null} />
        </Card>

        <Card n={5} title="希望する仕事">
          <Field label={`希望月給（手取り）：${f.sal || 16}万円`} opt><input type="range" min={16} max={40} value={f.sal || 16} onChange={(e) => set("sal", Number(e.target.value))} className="w-full accent-bl-red" /></Field>
          <Field label="希望する特定技能分野"><Many options={IND} value={f.fields} onChange={(v) => set("fields", v)} /></Field>
          <Field label="希望勤務地"><Many options={PREF_OPTIONS} value={f.areas} onChange={(v) => set("areas", v)} scroll /></Field>
          <Field label="希望職種" opt><input value={f.desiredJobType} onChange={(e) => set("desiredJobType", e.target.value)} placeholder="例）溶接 / 介護 / 惣菜製造 など" className={inputCls} /></Field>
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

        <CandidateDocuments initDocs={initDocs} />
      </fieldset>

      {/* Footer thao tác */}
      <div className="sticky bottom-20 z-10 lg:bottom-4">
        {err && <p className="mb-2 rounded-lg bg-bl-redsoft px-3 py-2 text-center text-sm font-semibold text-bl-red">{err}</p>}
        {editing ? (
          <div className="flex gap-2">
            <button onClick={cancel} disabled={saving} className="rounded-2xl border border-bl-line bg-white px-5 py-4 text-base font-bold text-bl-gray hover:bg-bl-bg disabled:opacity-60">キャンセル</button>
            <button onClick={save} disabled={saving} className="flex-1 rounded-2xl bg-bl-red py-4 text-base font-bold text-white shadow-lg hover:bg-bl-redd disabled:opacity-60">
              {saving ? "保存中…" : "プロフィールを保存する"}
            </button>
          </div>
        ) : (
          <button onClick={() => { setEditing(true); setSaved(false); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-bl-red py-4 text-base font-bold text-white shadow-lg hover:bg-bl-redd">
            <IconEdit /> {saved ? "保存しました（編集する）" : "プロフィールを編集する"}
          </button>
        )}
      </div>
    </div>
  );
}
