"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Completion, TabKey } from "@/lib/adminCandidate";
import { NATIONALITIES, VISA_TYPES, JP_LEVELS, SKILL_FIELDS, DORM_OPTIONS, START_OPTIONS, NIGHTSHIFT_OPTIONS, SHIFTWORK_OPTIONS, REASONS, PRIORITIES } from "@/lib/candidateFields";
import { PREFECTURES } from "@/lib/prefectures";

export type DetailData = {
  id: string;
  image: string | null;
  name: string;
  kana: string;
  gender: string;
  birthdate: string;
  nationality: string;
  phone: string;
  email: string;
  visaType: string;
  visaExpiryDate: string;
  currentTokuteiField: string;
  japaneseLevel: string;
  desiredLocation: string;
  desiredIndustry: string;
  desiredSalary: number;
  canChangeJobFrom: string;
  internalMemo: string;
  status: string;
  address: string;
  facebookUrl: string; instagramUrl: string; tiktokUrl: string;
  arrival: string;
  sswCategory: string; sswTask: string; otherSkills: string;
  desiredJobType: string;
  dorm: string; start: string; nightshift: string; shiftwork: string;
  reasons: string[]; reasonOther: string; priorities: string[];
  zairyuDocs: { name: string; file: string }[];
  workphotosDocs: { name: string; file: string }[];
  apps: { id: string; code: string; title: string; company: string; status: string; statusLabel: string; createdAt: string }[];
};

// chip multi-select (cho 転職理由 / 重視) — module scope để input giữ focus.
function Chips({ options, value, onChange, scroll }: { options: string[]; value: string[]; onChange: (v: string[]) => void; scroll?: boolean }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className={`flex flex-wrap gap-1.5 ${scroll ? "max-h-44 overflow-y-auto" : ""}`}>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => toggle(o)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${value.includes(o) ? "border-navy bg-navy text-white" : "border-slate-200 text-slate-600 hover:border-navy"}`}>{o}</button>
      ))}
    </div>
  );
}

type Tab = TabKey | "history" | "memo";
const TABS: { key: Tab; label: string }[] = [
  { key: "basic", label: "基本情報" },
  { key: "visa", label: "在留資格" },
  { key: "wish", label: "希望条件" },
  { key: "history", label: "応募履歴" },
  { key: "memo", label: "メモ" },
];

// 5 giai đoạn cho timeline 応募履歴
const STAGE5 = ["応募", "面談", "企業面接", "内定", "入社"];
const STAGE_OF: Record<string, number> = {
  NEW: 0, CONSULTING: 1, DOC_CHECK: 1, CV_SENT: 1,
  INTERVIEW_ARRANGING: 2, INTERVIEW_SCHEDULED: 2, INTERVIEWED: 2,
  OFFER: 3, CONTRACT: 3, VISA_APPLYING: 4, VISA_APPROVED: 4, JOIN_SCHEDULED: 4, JOINED: 4,
};
const ENDED = new Set(["REJECTED", "DECLINED", "CANCELLED"]);

const genderJP = (g: string) => (g === "MALE" ? "男性" : g === "FEMALE" ? "女性" : "");

function Icon({ d, size = 16 }: { d: React.ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}

// Hàng hiển thị/sửa — định nghĩa ở module scope để input giữ focus khi gõ.
function Row({ editing, label, view, children }: { editing: boolean; label: string; view: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="border-b border-slate-50 py-3 last:border-0">
      <div className="mb-1 text-xs font-semibold text-slate-500">{label}</div>
      {editing && children ? children : <div className="text-sm font-medium text-slate-800">{view || <span className="text-slate-400">未入力</span>}</div>}
    </div>
  );
}

export function CandidateDetail({ data, completion, canEdit, canDelete }: { data: DetailData; completion: Completion; canEdit: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("basic");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [f, setF] = useState(data);
  const set = <K extends keyof DetailData>(k: K, v: DetailData[K]) => setF((p) => ({ ...p, [k]: v }));

  function cancel() { setF(data); setEditing(false); }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/candidates/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.name, kana: f.kana, gender: f.gender, birthdate: f.birthdate, nationality: f.nationality,
        phone: f.phone, email: f.email, visaType: f.visaType, visaExpiryDate: f.visaExpiryDate,
        currentTokuteiField: f.currentTokuteiField, japaneseLevel: f.japaneseLevel,
        desiredLocation: f.desiredLocation, desiredIndustry: f.desiredIndustry,
        desiredSalary: f.desiredSalary ? f.desiredSalary * 10000 : null, canChangeJobFrom: f.canChangeJobFrom,
        internalMemo: f.internalMemo,
        // các trường user nhập thêm (cột + prefs)
        currentAddress: f.address, facebookUrl: f.facebookUrl, instagramUrl: f.instagramUrl, tiktokUrl: f.tiktokUrl,
        arrival: f.arrival, sswCategory: f.sswCategory, sswTask: f.sswTask, otherSkills: f.otherSkills,
        desiredJobType: f.desiredJobType, dorm: f.dorm, start: f.start, nightshift: f.nightshift, shiftwork: f.shiftwork,
        reasons: f.reasons, reasonOther: f.reasonOther, priorities: f.priorities,
      }),
    });
    setSaving(false);
    if (res.ok) { setEditing(false); router.refresh(); }
    else alert((await res.json().catch(() => ({}))).error || "保存に失敗しました");
  }

  async function doDelete() {
    const res = await fetch(`/api/candidates/${data.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/admin/candidates"); router.refresh(); }
    else { setDelOpen(false); alert((await res.json().catch(() => ({}))).error || "削除に失敗しました"); }
  }

  // điều hướng từ mục thiếu → tab tương ứng + bật chỉnh sửa
  function goMissing(t: TabKey) { setTab(t); if (canEdit) setEditing(true); }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/candidates" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-navy">
        <Icon d={<path d="M15 18l-6-6 6-6" />} />応募者一覧
      </Link>

      {/* Header */}
      <div className="card mb-4 flex flex-wrap items-center gap-4 p-4">
        {data.image
          ? <img src={data.image} alt={data.name} className="h-14 w-14 rounded-full object-cover" />
          : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-lg font-bold text-navy">{(data.name || "?").charAt(0)}</span>}
        <div className="min-w-0">
          <h1 className="text-lg font-black text-navy">{data.name || "（未入力）"}</h1>
          <div className="text-sm text-slate-400">{data.kana || "—"}</div>
        </div>
        <span className="badge bg-slate-100 text-slate-600">{data.status}</span>
        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={cancel} className="btn btn-ghost">キャンセル</button>
              <button onClick={save} disabled={saving} className="btn btn-navy">
                <Icon d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>} />
                {saving ? "保存中…" : "保存する"}
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button onClick={() => setEditing(true)} className="btn btn-ghost">
                  <Icon d={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>} />編集
                </button>
              )}
              {canDelete && (
                <button onClick={() => setDelOpen(true)} className="btn btn-ghost text-red-600 hover:border-red-300">
                  <Icon d={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>} />削除
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* プロフィール完成度 */}
      <div className="card mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Icon d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></>} />プロフィール完成度
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-navy">{completion.pct}%</span>
            <span className={`badge ${completion.status === "対応可能" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{completion.status}</span>
          </div>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all ${completion.pct >= 80 ? "bg-emerald-500" : "bg-navy"}`} style={{ width: `${completion.pct}%` }} />
        </div>
        {completion.missing.length > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 text-xs font-semibold text-slate-500">未入力項目（クリックで該当タブへ）:</div>
            <div className="flex flex-wrap gap-1.5">
              {completion.missing.map((m) => (
                <button key={m.key} onClick={() => goMissing(m.tab)} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                  <Icon d={<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>} size={12} />{m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 p-2">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex-none whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${tab === t.key ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"}`}>{t.label}</button>
          ))}
        </div>

        <div className="p-5">
          {/* 基本情報 */}
          {tab === "basic" && (
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Row editing={editing} label="氏名" view={f.name}><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></Row>
              <Row editing={editing} label="フリガナ" view={f.kana}><input className="input" value={f.kana} onChange={(e) => set("kana", e.target.value)} placeholder="グエン ヴァン A" /></Row>
              <Row editing={editing} label="性別" view={genderJP(f.gender)}>
                <select className="input" value={f.gender} onChange={(e) => set("gender", e.target.value)}><option value="ANY">未選択</option><option value="MALE">男性</option><option value="FEMALE">女性</option></select>
              </Row>
              <Row editing={editing} label="生年月日" view={f.birthdate}><input type="date" className="input" value={f.birthdate} onChange={(e) => set("birthdate", e.target.value)} /></Row>
              <Row editing={editing} label="国籍" view={f.nationality}>
                <select className="input" value={f.nationality} onChange={(e) => set("nationality", e.target.value)}><option value="">未選択</option>{NATIONALITIES.map((n) => <option key={n}>{n}</option>)}</select>
              </Row>
              <Row editing={editing} label="電話番号" view={f.phone}><input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="090-1234-5678" /></Row>
              <Row editing={editing} label="メールアドレス" view={f.email}><input type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></Row>
              <Row editing={editing} label="現在の住所（都道府県）" view={f.address}>
                <select className="input" value={f.address} onChange={(e) => set("address", e.target.value)}><option value="">未選択</option>{f.address && !PREFECTURES.includes(f.address) && <option value={f.address}>{f.address}</option>}{PREFECTURES.map((p) => <option key={p}>{p}</option>)}</select>
              </Row>
              <Row editing={editing} label="Facebook" view={f.facebookUrl ? <a href={f.facebookUrl} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">{f.facebookUrl}</a> : ""}><input className="input" value={f.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/…" /></Row>
              <Row editing={editing} label="Instagram" view={f.instagramUrl ? <a href={f.instagramUrl} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">{f.instagramUrl}</a> : ""}><input className="input" value={f.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/…" /></Row>
              <Row editing={editing} label="TikTok" view={f.tiktokUrl ? <a href={f.tiktokUrl} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">{f.tiktokUrl}</a> : ""}><input className="input" value={f.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} placeholder="https://tiktok.com/@…" /></Row>
            </div>
          )}

          {/* 在留資格 */}
          {tab === "visa" && (
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Row editing={editing} label="現在の在留資格" view={f.visaType}>
                <select className="input" value={f.visaType} onChange={(e) => set("visaType", e.target.value)}><option value="">未選択</option>{VISA_TYPES.map((v) => <option key={v}>{v}</option>)}</select>
              </Row>
              <Row editing={editing} label="在留期限" view={f.visaExpiryDate}><input type="date" className="input" value={f.visaExpiryDate} onChange={(e) => set("visaExpiryDate", e.target.value)} /></Row>
              <Row editing={editing} label="特定技能分野" view={f.currentTokuteiField}>
                <select className="input" value={f.currentTokuteiField} onChange={(e) => set("currentTokuteiField", e.target.value)}><option value="">未選択</option>{SKILL_FIELDS.map((s) => <option key={s}>{s}</option>)}</select>
              </Row>
              <Row editing={editing} label="日本語レベル" view={f.japaneseLevel}>
                <select className="input" value={f.japaneseLevel} onChange={(e) => set("japaneseLevel", e.target.value)}><option value="">未選択</option>{JP_LEVELS.map((j) => <option key={j}>{j}</option>)}</select>
              </Row>
              <Row editing={editing} label="来日年月日" view={f.arrival}><input type="date" className="input" value={f.arrival} onChange={(e) => set("arrival", e.target.value)} /></Row>
              <Row editing={editing} label="業務区分" view={f.sswCategory}><input className="input" value={f.sswCategory} onChange={(e) => set("sswCategory", e.target.value)} placeholder="例）溶接" /></Row>
              <Row editing={editing} label="従事する主な業務" view={f.sswTask}><input className="input" value={f.sswTask} onChange={(e) => set("sswTask", e.target.value)} /></Row>
              <div className="sm:col-span-2"><Row editing={editing} label="その他の経験・スキル" view={f.otherSkills}><textarea className="input" rows={2} value={f.otherSkills} onChange={(e) => set("otherSkills", e.target.value)} /></Row></div>
              <div className="py-3 sm:col-span-2">
                <div className="mb-1.5 text-xs font-semibold text-slate-500">製品の写真（溶接など）</div>
                {data.workphotosDocs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">{data.workphotosDocs.map((d) => <a key={d.file} href={`/api/candidates/${data.id}/document?slot=workphotos&file=${encodeURIComponent(d.file)}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200"><img src={`/api/candidates/${data.id}/document?slot=workphotos&file=${encodeURIComponent(d.file)}`} alt={d.name} className="h-28 w-44 object-cover" /></a>)}</div>
                ) : <div className="text-sm text-slate-400">未提出</div>}
              </div>
              <div className="py-3 sm:col-span-2">
                <div className="mb-1.5 text-xs font-semibold text-slate-500">在留カード画像</div>
                {data.zairyuDocs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.zairyuDocs.map((d) => (
                      <a key={d.file} href={`/api/candidates/${data.id}/document?slot=zairyu&file=${encodeURIComponent(d.file)}`} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
                        <img src={`/api/candidates/${data.id}/document?slot=zairyu&file=${encodeURIComponent(d.file)}`} alt={d.name} className="h-28 w-44 object-cover" />
                      </a>
                    ))}
                  </div>
                ) : <div className="text-sm text-slate-400">未提出</div>}
              </div>
            </div>
          )}

          {/* 希望条件 */}
          {tab === "wish" && (
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Row editing={editing} label="希望勤務地" view={f.desiredLocation}><input className="input" value={f.desiredLocation} onChange={(e) => set("desiredLocation", e.target.value)} placeholder="愛知県, 岐阜県 …" /></Row>
              <Row editing={editing} label="希望職種" view={f.desiredIndustry}><input className="input" value={f.desiredIndustry} onChange={(e) => set("desiredIndustry", e.target.value)} placeholder="工業製品製造業 …" /></Row>
              <Row editing={editing} label="希望給与" view={f.desiredSalary ? `${f.desiredSalary}万円` : ""}>
                <div className="flex items-center gap-2"><input type="number" className="input" value={f.desiredSalary || ""} onChange={(e) => set("desiredSalary", Number(e.target.value))} /><span className="text-sm text-slate-500">万円</span></div>
              </Row>
              <Row editing={editing} label="転職可能時期" view={f.canChangeJobFrom}><input type="date" className="input" value={f.canChangeJobFrom} onChange={(e) => set("canChangeJobFrom", e.target.value)} /></Row>
              <Row editing={editing} label="希望職種" view={f.desiredJobType}><input className="input" value={f.desiredJobType} onChange={(e) => set("desiredJobType", e.target.value)} placeholder="例）溶接 / 介護 / 惣菜製造" /></Row>
              <Row editing={editing} label="寮の希望" view={f.dorm}><select className="input" value={f.dorm} onChange={(e) => set("dorm", e.target.value)}><option value="">未選択</option>{DORM_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></Row>
              <Row editing={editing} label="いつから働けますか" view={f.start}><select className="input" value={f.start} onChange={(e) => set("start", e.target.value)}><option value="">未選択</option>{START_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></Row>
              <Row editing={editing} label="夜勤できますか" view={f.nightshift}><select className="input" value={f.nightshift} onChange={(e) => set("nightshift", e.target.value)}><option value="">未選択</option>{NIGHTSHIFT_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></Row>
              <Row editing={editing} label="交替勤務できますか" view={f.shiftwork}><select className="input" value={f.shiftwork} onChange={(e) => set("shiftwork", e.target.value)}><option value="">未選択</option>{SHIFTWORK_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></Row>
              <div className="sm:col-span-2">
                <Row editing={editing} label="転職理由・希望する働き方" view={f.reasons.length ? f.reasons.join("、") + (f.reasonOther ? ` / ${f.reasonOther}` : "") : ""}>
                  <div className="space-y-2"><Chips options={REASONS} value={f.reasons} onChange={(v) => set("reasons", v)} scroll />{f.reasons.includes("その他（自由入力）") && <textarea className="input" rows={2} value={f.reasonOther} onChange={(e) => set("reasonOther", e.target.value)} placeholder="その他の理由" />}</div>
                </Row>
              </div>
              <div className="sm:col-span-2">
                <Row editing={editing} label="最も重視すること（3つまで）" view={f.priorities.join("、")}><Chips options={PRIORITIES} value={f.priorities} onChange={(v) => set("priorities", v)} /></Row>
              </div>
            </div>
          )}

          {/* 応募履歴 */}
          {tab === "history" && (
            data.apps.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">応募履歴はありません</div>
            ) : (
              <div className="space-y-4">
                {data.apps.map((a) => {
                  const ended = ENDED.has(a.status);
                  const stage = STAGE_OF[a.status] ?? 0;
                  return (
                    <div key={a.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">{a.code}</span>
                        <span className="font-semibold text-slate-800">{a.title}</span>
                        <span className="text-xs text-slate-400">{a.company}</span>
                        <span className={`badge ml-auto ${ended ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>{a.statusLabel}</span>
                      </div>
                      {!ended && (
                        <div className="flex items-center">
                          {STAGE5.map((label, i) => (
                            <div key={label} className="flex flex-1 items-center last:flex-none">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${i < stage ? "bg-emerald-500 text-white" : i === stage ? "bg-navy text-white" : "bg-slate-100 text-slate-400"}`}>{i < stage ? "✓" : i + 1}</div>
                                <span className={`text-[10px] ${i === stage ? "font-bold text-navy" : "text-slate-400"}`}>{label}</span>
                              </div>
                              {i < STAGE5.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < stage ? "bg-emerald-500" : "bg-slate-100"}`} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* メモ (admin only) */}
          {tab === "memo" && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <Icon d={<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} size={13} />このメモは社内（Admin）のみ閲覧できます。
              </div>
              {editing ? (
                <textarea className="input min-h-[180px]" value={f.internalMemo} onChange={(e) => set("internalMemo", e.target.value)} placeholder="相談内容・対応状況などを記録…" />
              ) : (
                <div className="min-h-[120px] whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{f.internalMemo || <span className="text-slate-400">メモはありません</span>}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* delete modal */}
      {delOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDelOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold">応募者を削除しますか？</h3>
            <p className="mt-1 text-sm text-slate-500">この操作は取り消せません。応募履歴も削除されます。</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setDelOpen(false)}>キャンセル</button>
              <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={doDelete}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
