"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobPreview } from "./JobPreview";
import {
  FIELDS, PREFS, PAY_TYPES, STD_BENEFITS, STD_TAGS, JP_LEVELS, START_OPTS, HOUSE_TYPES,
  makeDefaultForm, formToPayload, type JobFormState, type Num,
} from "@/lib/jobFormModel";
import { PUBLIC_STATUS_LABEL } from "@/lib/constants";

type Opt = { id: string; name: string };

const CSS = `
.bl-jf{--red:#D02E26;--red-d:#A8231C;--red-soft:#FDECEA;--ink:#16181D;--gray:#5B6472;--gray-2:#9AA2AE;--line:#ECECEF;--bg:#F7F8FA;--green:#1F9D55;--green-soft:#E6F6EC;--blue:#2563EB;--shadow:0 1px 2px rgba(16,24,40,.04),0 8px 24px rgba(16,24,40,.08);color:var(--ink);font-family:'Noto Sans JP',system-ui,sans-serif}
.bl-jf .jf-head{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.bl-jf .jf-head .ht{font-size:16px;font-weight:900;margin-right:auto}
.bl-jf .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:700;border-radius:11px;padding:11px 18px;font-size:14px;transition:.16s;white-space:nowrap;cursor:pointer;border:none}
.bl-jf .btn-red{background:var(--red);color:#fff;box-shadow:0 6px 16px rgba(208,46,38,.28)}
.bl-jf .btn-red:hover{background:var(--red-d)}
.bl-jf .btn-red:disabled{opacity:.6}
.bl-jf .btn-ghost{background:#fff;border:1.5px solid var(--line);color:var(--ink)}
.bl-jf .btn-ghost:hover{border-color:var(--gray-2)}
.bl-jf .jf-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:24px;align-items:start}
.bl-jf .jf-form{min-width:0}
.bl-jf .jf-pv{position:sticky;top:80px;min-width:0}
@media(max-width:1100px){.bl-jf .jf-layout{grid-template-columns:1fr}.bl-jf .jf-pv{position:static}}
.bl-jf .section{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;margin-bottom:16px;box-shadow:var(--shadow)}
.bl-jf .section>h2{font-size:15.5px;font-weight:900;display:flex;align-items:center;gap:9px;margin-bottom:4px}
.bl-jf .section>h2 .num{width:24px;height:24px;flex:0 0 auto;border-radius:8px;background:var(--red-soft);color:var(--red);font-size:12.5px;font-weight:900;display:flex;align-items:center;justify-content:center}
.bl-jf .section>.sdesc{font-size:12px;color:var(--gray-2);margin:0 0 14px 33px}
.bl-jf .grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.bl-jf .grid.cols3{grid-template-columns:1fr 1fr 1fr}
.bl-jf .field{display:flex;flex-direction:column;gap:5px}
.bl-jf .field.full{grid-column:1/-1}
.bl-jf .field label{font-size:12.5px;font-weight:800;color:var(--ink)}
.bl-jf .field label .req{color:var(--red);margin-left:3px}
.bl-jf .field .hint{font-size:11px;color:var(--gray-2);font-weight:500;line-height:1.4}
.bl-jf .inp,.bl-jf .sel,.bl-jf .ta{border:1.5px solid var(--line);background:#fff;border-radius:10px;padding:10px 12px;width:100%;outline:none;transition:.14s;font-weight:600;font-size:14px;font-family:inherit;color:var(--ink)}
.bl-jf .inp:focus,.bl-jf .sel:focus,.bl-jf .ta:focus{border-color:var(--red);box-shadow:0 0 0 3px var(--red-soft)}
.bl-jf .sel{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239AA2AE' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center;padding-right:32px}
.bl-jf .ta{resize:vertical;min-height:84px;line-height:1.65;font-weight:500}
.bl-jf .with-unit{display:flex;align-items:center;gap:8px}
.bl-jf .with-unit .inp{flex:1}
.bl-jf .with-unit .unit{font-size:13px;font-weight:800;color:var(--gray);flex:0 0 auto}
.bl-jf .chips{display:flex;flex-wrap:wrap;gap:8px}
.bl-jf .chip-btn{font-size:13px;font-weight:700;padding:8px 14px;border-radius:20px;background:var(--bg);color:var(--gray);border:1.5px solid transparent;transition:.14s;cursor:pointer}
.bl-jf .chip-btn:hover{background:#EEF0F3}
.bl-jf .chip-btn.on{background:var(--red);color:#fff}
.bl-jf .chip-btn.multi.on{background:var(--green-soft);color:var(--green);border-color:#BCE7CC}
.bl-jf .chip-btn.tag.on{background:#E8F0FE;color:var(--blue);border-color:#C7DBFD}
.bl-jf .chip-add{display:flex;gap:7px;margin-top:9px}
.bl-jf .chip-add .inp{flex:1;padding:8px 11px}
.bl-jf .chip-add button{flex:0 0 auto;padding:8px 14px;border-radius:10px;background:var(--ink);color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;border:none}
.bl-jf .toggle{display:inline-flex;border:1.5px solid var(--line);border-radius:10px;overflow:hidden}
.bl-jf .toggle button{padding:9px 16px;font-size:13px;font-weight:700;color:var(--gray);background:#fff;cursor:pointer;border:none}
.bl-jf .toggle button.on{background:var(--red);color:#fff}
.bl-jf .lines{display:flex;flex-direction:column;gap:8px}
.bl-jf .line-row{display:flex;gap:8px;align-items:center}
.bl-jf .line-row .inp{flex:1}
.bl-jf .line-row .del{flex:0 0 auto;width:36px;height:36px;border-radius:9px;background:var(--red-soft);color:var(--red);font-size:17px;font-weight:800;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none}
.bl-jf .addline{align-self:flex-start;font-size:12.5px;font-weight:800;color:var(--red);padding:7px 12px;border:1.5px dashed var(--red-soft);border-radius:9px;background:#fff;margin-top:2px;cursor:pointer}
.bl-jf .addline:hover{background:var(--red-soft)}
.bl-jf .recruit{border:1.5px solid var(--red-soft);background:#FFFBFA;border-radius:12px;padding:12px 14px;margin-bottom:14px}
.bl-jf .recruit .rt{font-size:12.5px;font-weight:900;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:7px}
.bl-jf .recruit .rt .tag{font-size:10px;font-weight:800;color:var(--red);background:var(--red-soft);padding:2px 7px;border-radius:6px}
.bl-jf .recruit .rg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.bl-jf .recruit .rg .unit{font-size:13px;font-weight:800;color:var(--gray)}
.bl-jf .recruit .rh{font-size:11px;color:var(--gray-2);margin-top:7px}
.bl-jf .admin-note{font-size:12px;font-weight:700;color:#7A5C00;background:#FFF8E1;border:1px solid #F3E2A8;border-radius:9px;padding:8px 12px;margin-bottom:12px}
`;

export function JobForm({
  mode, jobId, companies, canInternal, initialForm, code,
}: {
  mode: "create" | "edit";
  jobId?: string;
  companies: Opt[];
  canInternal: boolean;
  initialForm?: JobFormState;
  code?: string;
}) {
  const router = useRouter();
  const [s, setS] = useState<JobFormState>(initialForm ?? makeDefaultForm(companies[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [benefitCustom, setBenefitCustom] = useState("");
  const [tagCustom, setTagCustom] = useState("");

  const set = <K extends keyof JobFormState>(k: K, v: JobFormState[K]) => setS((p) => ({ ...p, [k]: v }));
  const companyName = companies.find((c) => c.id === s.companyId)?.name ?? "";

  // chips
  const toggleArr = (k: "benefits" | "tags", v: string) => set(k, s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v]);
  const addCustom = (k: "benefits" | "tags", v: string, clear: () => void) => { const t = v.trim(); if (t && !s[k].includes(t)) set(k, [...s[k], t]); clear(); };
  // lines
  const lk = ["appeal", "active", "quals", "nearby"] as const;
  type LK = (typeof lk)[number];
  const addLine = (k: LK) => set(k, [...s[k], ""]);
  const setLine = (k: LK, i: number, v: string) => set(k, s[k].map((x, j) => (j === i ? v : x)));
  const delLine = (k: LK, i: number) => set(k, s[k].filter((_, j) => j !== i));

  // recruit clamp
  const pNum = (v: string): Num => (v === "" ? "" : Math.max(0, Math.floor(Number(v) || 0)));
  const T = s.recruitTotal === "" ? 0 : s.recruitTotal;
  const M = s.recruitMale === "" ? 0 : s.recruitMale;
  const F = s.recruitFemale === "" ? 0 : s.recruitFemale;
  function onTotal(v: string) {
    const t = pNum(v); const tn = t === "" ? 0 : t;
    let m: Num = s.recruitMale, f: Num = s.recruitFemale;
    if (M + F > tn) { f = Math.max(0, tn - M); if (M > tn) { m = tn; f = 0; } }
    setS((p) => ({ ...p, recruitTotal: t, recruitMale: m, recruitFemale: f }));
  }
  const onMale = (v: string) => { const r = pNum(v); set("recruitMale", r === "" ? "" : Math.min(r, Math.max(0, T - F))); };
  const onFemale = (v: string) => { const r = pNum(v); set("recruitFemale", r === "" ? "" : Math.min(r, Math.max(0, T - M))); };

  const PH: Record<LK, string> = { appeal: "例）未経験から月収25万円可", active: "例）コツコツ作業が得意な人", quals: "例）在留資格 特定技能1号", nearby: "例）コンビニ 徒歩3分" };

  async function save() {
    setErr("");
    if (!s.companyId) { setErr("企業を選択してください（先に企業を追加してください）。"); return; }
    setSaving(true);
    const res = await fetch(mode === "create" ? "/api/jobs" : `/api/jobs/${jobId}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(s, mode)),
    });
    setSaving(false);
    if (res.ok) { router.push("/admin/jobs"); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error || "保存に失敗しました");
  }
  function clearForm() {
    if (!confirm("入力内容をクリアしますか？")) return;
    setS(makeDefaultForm(companies[0]?.id ?? ""));
  }

  // hàm trả JSX (KHÔNG phải component) để input giữ focus khi gõ
  const renderLines = (k: LK) => (
    <>
      <div className="lines">
        {s[k].map((v, i) => (
          <div className="line-row" key={i}>
            <input className="inp" value={v} placeholder={PH[k]} onChange={(e) => setLine(k, i, e.target.value)} />
            <button type="button" className="del" onClick={() => delLine(k, i)} title="削除">×</button>
          </div>
        ))}
      </div>
      <button type="button" className="addline" onClick={() => addLine(k)}>＋ 行を追加</button>
    </>
  );

  return (
    <div className="bl-jf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="jf-head">
        <span className="ht">求人票の{mode === "create" ? "作成" : "編集"}（管理）</span>
        <button className="btn btn-ghost" onClick={clearForm}>クリア</button>
        <button className="btn btn-ghost" onClick={() => router.push("/admin/jobs")}>キャンセル</button>
        <button className="btn btn-red" onClick={save} disabled={saving}>{saving ? "保存中…" : mode === "create" ? "求人を作成" : "変更を保存"}</button>
      </div>
      {err && <div className="admin-note" style={{ color: "#A8231C", background: "#FDECEA", borderColor: "#F3C9C5" }}>{err}</div>}

      <div className="jf-layout">
        {/* ============ FORM ============ */}
        <div className="jf-form">
          {/* 1 基本情報 */}
          <div className="section">
            <h2><span className="num">1</span>基本情報</h2>
            <p className="sdesc">求人の業種・職種・会社・勤務地</p>
            <div className="grid">
              <div className="field full"><label>業種（特定技能分野）<span className="req">*</span></label><select className="sel" value={s.field} onChange={(e) => set("field", e.target.value)}>{FIELDS.map((x) => <option key={x}>{x}</option>)}</select><span className="hint">特定技能の正式名称から選択。求人コードの接頭辞に使われます。</span></div>
              <div className="field"><label>職種<span className="req">*</span></label><input className="inp" value={s.type} onChange={(e) => set("type", e.target.value)} placeholder="例）半自動溶接 / 型枠大工 / 惣菜製造" /><span className="hint">具体的な仕事の呼び名</span></div>
              <div className="field"><label>掲載企業<span className="req">*</span></label><select className="sel" value={s.companyId} onChange={(e) => set("companyId", e.target.value)}><option value="">選択してください</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><span className="hint">企業管理に登録された企業から選択（応募者には非公開）。</span></div>
              <div className="field full"><label>求人タイトル</label><input className="inp" value={s.title} onChange={(e) => set("title", e.target.value)} placeholder="例）半自動溶接スタッフ（未経験OK・寮あり）" /><span className="hint">空欄なら「職種」を見出しに使用します。</span></div>
              <div className="field"><label>勤務地（都道府県）<span className="req">*</span></label><select className="sel" value={s.pref} onChange={(e) => set("pref", e.target.value)}>{PREFS.map((x) => <option key={x}>{x}</option>)}</select><span className="hint">求人の所在エリア</span></div>
              <div className="field"><label>勤務地（市区町村）</label><input className="inp" value={s.city} onChange={(e) => set("city", e.target.value)} placeholder="例）豊田市" /><span className="hint">市区町村名</span></div>
            </div>
          </div>

          {/* 2 給与 */}
          <div className="section">
            <h2><span className="num">2</span>給与</h2>
            <p className="sdesc">基本給・月収例・手取り（労働者が最も気にする部分）</p>
            <div className="field full" style={{ marginBottom: 13 }}><label>基本給 — 区分</label><div className="chips">{PAY_TYPES.map((p) => <button type="button" key={p} className={`chip-btn${s.payType === p ? " on" : ""}`} onClick={() => set("payType", p)}>{p}</button>)}</div><span className="hint">時給・日給・月給のいずれか</span></div>
            <div className="grid cols3">
              <div className="field"><label>金額</label><div className="with-unit"><input className="inp" type="number" inputMode="numeric" value={s.payAmount} onChange={(e) => set("payAmount", pNum(e.target.value))} placeholder="例）1300" /><span className="unit">円</span></div><span className="hint">区分に対応した金額</span></div>
              <div className="field"><label>月収例</label><div className="with-unit"><input className="inp" type="number" inputMode="numeric" value={s.monthly} onChange={(e) => set("monthly", pNum(e.target.value))} placeholder="例）250000" /><span className="unit">円</span></div><span className="hint">残業・手当込みの目安</span></div>
              <div className="field"><label>手取り月収</label><div className="with-unit"><input className="inp" type="number" inputMode="numeric" value={s.takehome} onChange={(e) => set("takehome", pNum(e.target.value))} placeholder="例）205000" /><span className="unit">円</span></div><span className="hint">税・社会保険を引いた後／家賃は含まない</span></div>
              <div className="field full"><label>基本給の補足</label><input className="inp" value={s.payNote} onChange={(e) => set("payNote", e.target.value)} placeholder="例）試用期間3ヶ月は時給1,200円 / 深夜手当別途" /><span className="hint">条件や手当の注意書き</span></div>
            </div>
          </div>

          {/* 3 募集要項 */}
          <div className="section">
            <h2><span className="num">3</span>募集要項</h2>
            <p className="sdesc">募集人数・雇用条件・勤務形態・待遇</p>

            {/* 募集人数 (đầu mục) */}
            <div className="recruit">
              <div className="rt">募集人数 <span className="tag">数字のみ</span></div>
              <div className="rg">
                <div className="field"><label>総募集人数</label><div className="with-unit"><input className="inp" type="number" inputMode="numeric" min={0} value={s.recruitTotal} onChange={(e) => onTotal(e.target.value)} placeholder="0" /><span className="unit">名</span></div></div>
                <div className="field"><label>男</label><div className="with-unit"><input className="inp" type="number" inputMode="numeric" min={0} max={T - F} value={s.recruitMale} onChange={(e) => onMale(e.target.value)} placeholder="0" /><span className="unit">名</span></div></div>
                <div className="field"><label>女</label><div className="with-unit"><input className="inp" type="number" inputMode="numeric" min={0} max={T - M} value={s.recruitFemale} onChange={(e) => onFemale(e.target.value)} placeholder="0" /><span className="unit">名</span></div></div>
              </div>
              <div className="rh">男＋女は総数（{T}名）を超えられません。{T - M - F > 0 ? `未指定 ${T - M - F}名` : T > 0 ? "内訳が一致しています" : ""}</div>
            </div>

            <div className="grid">
              <div className="field"><label>雇用期間</label><input className="inp" value={s.term} onChange={(e) => set("term", e.target.value)} placeholder="例）特定技能1号（通算上限5年）" /><span className="hint">在留資格・契約期間</span></div>
              <div className="field"><label>勤務時間</label><input className="inp" value={s.hours} onChange={(e) => set("hours", e.target.value)} placeholder="例）8:00〜17:00（休憩60分）" /><span className="hint">シフト・実働時間</span></div>
              <div className="field"><label>残業時間</label><input className="inp" value={s.overtime} onChange={(e) => set("overtime", e.target.value)} placeholder="例）月平均20時間程度" /><span className="hint">月平均の目安</span></div>
              <div className="field"><label>休日・休暇</label><input className="inp" value={s.holiday} onChange={(e) => set("holiday", e.target.value)} placeholder="例）土日休み・年間休日120日" /><span className="hint">週休・年間休日・長期休暇</span></div>
              <div className="field"><label>通勤手段</label><input className="inp" value={s.commute} onChange={(e) => set("commute", e.target.value)} placeholder="例）寮から徒歩10分 / 送迎あり" /><span className="hint">通勤方法</span></div>
              <div className="field"><label>賞与・昇給</label><input className="inp" value={s.bonus} onChange={(e) => set("bonus", e.target.value)} placeholder="例）賞与年2回・昇給あり" /><span className="hint">ボーナス・昇給の有無</span></div>
              <div className="field full"><label>待遇・福利厚生</label><div className="chips">{STD_BENEFITS.map((b) => <button type="button" key={b} className={`chip-btn multi${s.benefits.includes(b) ? " on" : ""}`} onClick={() => toggleArr("benefits", b)}>{b}</button>)}{s.benefits.filter((b) => !STD_BENEFITS.includes(b)).map((b) => <button type="button" key={b} className="chip-btn multi on" onClick={() => toggleArr("benefits", b)}>{b} ×</button>)}</div><div className="chip-add"><input className="inp" value={benefitCustom} onChange={(e) => setBenefitCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom("benefits", benefitCustom, () => setBenefitCustom("")); } }} placeholder="その他の待遇を追加（例：退職金制度）" /><button type="button" onClick={() => addCustom("benefits", benefitCustom, () => setBenefitCustom(""))}>＋ 追加</button></div><span className="hint">複数選択可。カスタム追加もできます。</span></div>
            </div>
          </div>

          {/* 4 仕事内容 */}
          <div className="section">
            <h2><span className="num">4</span>仕事内容</h2>
            <p className="sdesc">具体的な業務・魅力・求める人物像</p>
            <div className="field full" style={{ marginBottom: 13 }}><label>仕事内容詳細</label><textarea className="ta" value={s.desc} onChange={(e) => set("desc", e.target.value)} placeholder="工場内で半自動溶接の作業を担当します。図面を見ながら部品を溶接し、検査・梱包までを行います。丁寧な指導があるため未経験の方も安心です。" /><span className="hint">1日の流れや作業内容を具体的に</span></div>
            <div className="field full" style={{ marginBottom: 13 }}><label>アピールポイント</label>{renderLines("appeal")}<span className="hint">1行＝1ポイント（例：未経験から月収25万円可）</span></div>
            <div className="field full"><label>こんな人が活躍しています</label>{renderLines("active")}<span className="hint">1行＝1項目（例：体を動かす仕事が好きな人）</span></div>
          </div>

          {/* 5 応募条件 */}
          <div className="section">
            <h2><span className="num">5</span>応募条件</h2>
            <p className="sdesc">日本語レベル・資格・入社時期</p>
            <div className="grid">
              <div className="field"><label>日本語レベル</label><select className="sel" value={s.jp} onChange={(e) => set("jp", e.target.value)}>{JP_LEVELS.map((x) => <option key={x}>{x}</option>)}</select><span className="hint">必要な日本語能力</span></div>
              <div className="field"><label>入社できる時期</label><select className="sel" value={s.start} onChange={(e) => set("start", e.target.value)}>{START_OPTS.map((x) => <option key={x}>{x}</option>)}</select><span className="hint">受け入れ可能なタイミング</span></div>
              <div className="field full"><label>資格・条件</label>{renderLines("quals")}<span className="hint">1行＝1条件（例：在留資格 特定技能1号 / 18〜40歳）</span></div>
            </div>
          </div>

          {/* 6 住居・生活 */}
          <div className="section">
            <h2><span className="num">6</span>住居・生活</h2>
            <p className="sdesc">寮・家賃・光熱費など生活コスト</p>
            <div className="grid">
              <div className="field"><label>住居タイプ</label><select className="sel" value={s.houseType} onChange={(e) => set("houseType", e.target.value)}>{HOUSE_TYPES.map((x) => <option key={x}>{x}</option>)}</select><span className="hint">提供される住居の形態</span></div>
              <div className="field"><label>個室／相部屋</label><div className="toggle">{["個室", "相部屋"].map((r) => <button type="button" key={r} className={s.room === r ? "on" : ""} onClick={() => set("room", r)}>{r}</button>)}</div><span className="hint">部屋の利用形態</span></div>
              <div className="field"><label>同居人数</label><div className="with-unit"><input className="inp" type="number" inputMode="numeric" min={0} value={s.roommates} onChange={(e) => set("roommates", pNum(e.target.value))} placeholder="例）2" /><span className="unit">人</span></div><span className="hint">同じ部屋・寮の人数</span></div>
              <div className="field"><label>家賃</label><div className="with-unit"><input className="inp" type="number" inputMode="numeric" value={s.rent} onChange={(e) => set("rent", pNum(e.target.value))} placeholder="例）20000" /><span className="unit">円/月</span></div><span className="hint">毎月の自己負担額</span></div>
              <div className="field full"><label>部屋の説明</label><input className="inp" value={s.roomDesc} onChange={(e) => set("roomDesc", e.target.value)} placeholder="例）6畳・エアコン・冷蔵庫・洗濯機付き" /><span className="hint">設備や広さ</span></div>
              <div className="field"><label>電気・水道・ガス</label><input className="inp" value={s.utility} onChange={(e) => set("utility", e.target.value)} placeholder="例）実費 約8,000円" /><span className="hint">光熱費の負担</span></div>
              <div className="field"><label>インターネット代</label><input className="inp" value={s.internet} onChange={(e) => set("internet", e.target.value)} placeholder="例）無料 / 月3,000円" /><span className="hint">Wi-Fiの有無・費用</span></div>
              <div className="field full"><label>その他実費</label><input className="inp" value={s.otherCost} onChange={(e) => set("otherCost", e.target.value)} placeholder="例）寝具レンタル 月1,000円 / 駐車場 月2,000円" /><span className="hint">家賃以外にかかる費用</span></div>
            </div>
          </div>

          {/* 7 近隣情報 */}
          <div className="section">
            <h2><span className="num">7</span>近隣情報</h2>
            <p className="sdesc">徒歩15分圏内の施設（生活の便利さ）</p>
            <div className="field full"><label>近くの施設</label>{renderLines("nearby")}<span className="hint">1行＝1施設（例：コンビニ 徒歩3分 / スーパー 徒歩8分）</span></div>
          </div>

          {/* 8 タグ */}
          <div className="section">
            <h2><span className="num">8</span>タグ</h2>
            <p className="sdesc">検索・絞り込み用のタグ（複数選択可）</p>
            <div className="field full"><div className="chips">{STD_TAGS.map((t) => <button type="button" key={t} className={`chip-btn tag${s.tags.includes(t) ? " on" : ""}`} onClick={() => toggleArr("tags", t)}>{t}</button>)}{s.tags.filter((t) => !STD_TAGS.includes(t)).map((t) => <button type="button" key={t} className="chip-btn tag on" onClick={() => toggleArr("tags", t)}>{t} ×</button>)}</div><div className="chip-add"><input className="inp" value={tagCustom} onChange={(e) => setTagCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom("tags", tagCustom, () => setTagCustom("")); } }} placeholder="カスタムタグを追加（例：駅徒歩5分）" /><button type="button" onClick={() => addCustom("tags", tagCustom, () => setTagCustom(""))}>＋ 追加</button></div><span className="hint">標準タグから選択、または独自タグを追加できます。</span></div>
          </div>

          {/* 9 公開・社内メモ (管理) */}
          <div className="section">
            <h2><span className="num" style={{ background: "#E8F0FE", color: "#2563EB" }}>9</span>公開設定・社内メモ（管理）</h2>
            <p className="sdesc">公開ステータスと、社内だけが見るメモ</p>
            <div className="grid">
              <div className="field"><label>公開ステータス</label><select className="sel" value={s.publicStatus} onChange={(e) => set("publicStatus", e.target.value)}>{Object.entries(PUBLIC_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><span className="hint">公開／非公開／下書きなど</span></div>
              <div className="field"><label>おすすめ求人</label><div className="toggle">{[["1", "おすすめ"], ["0", "通常"]].map(([v, l]) => <button type="button" key={v} className={(s.isFeatured ? "1" : "0") === v ? "on" : ""} onClick={() => set("isFeatured", v === "1")}>{l}</button>)}</div><span className="hint">トップページの「おすすめ求人」に表示</span></div>
              <div className="field"><label>推奨（Recommended）</label><div className="toggle">{[["1", "推奨"], ["0", "通常"]].map(([v, l]) => <button type="button" key={v} className={(s.isRecommended ? "1" : "0") === v ? "on" : ""} onClick={() => set("isRecommended", v === "1")}>{l}</button>)}</div></div>
              <div className="field full"><label>求人画像URL</label><input className="inp" value={s.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…（空欄なら業種の既定画像）" /></div>
              <div className="field full"><label>SEOタイトル</label><input className="inp" value={s.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder="検索結果用タイトル（空欄なら求人タイトル）" /></div>
              <div className="field full"><label>SEOディスクリプション</label><input className="inp" value={s.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder="検索結果用の説明文（120〜160文字）" /></div>
            </div>
            {canInternal && (
              <>
                <div className="admin-note" style={{ marginTop: 12 }}>⚠ 社内専用：応募者・企業には表示されません。</div>
                <div className="field full" style={{ marginBottom: 13 }}><label>社内メモ</label><textarea className="ta" value={s.internalMemo} onChange={(e) => set("internalMemo", e.target.value)} placeholder="社内向けの補足・注意点など" /></div>
                <div className="field full" style={{ marginBottom: 13 }}><label>会社との交渉履歴</label><textarea className="ta" value={s.companyHistory} onChange={(e) => set("companyHistory", e.target.value)} placeholder="条件交渉・連絡の履歴" /></div>
                <div className="field full"><label>求人のリスク</label><textarea className="ta" value={s.riskNotes} onChange={(e) => set("riskNotes", e.target.value)} placeholder="注意すべきリスク・懸念点" /></div>
              </>
            )}
          </div>
        </div>

        {/* ============ LIVE PREVIEW ============ */}
        <div className="jf-pv">
          <JobPreview s={s} companyName={companyName} code={code} />
        </div>
      </div>
    </div>
  );
}
