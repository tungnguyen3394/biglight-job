"use client";

import { CODEPREF, computeSalary, type JobFormState } from "@/lib/jobFormModel";

const CSS = `
.bl-pv{--red:#D02E26;--ink:#16181D;--gray:#5B6472;--gray-2:#9AA2AE;--line:#ECECEF;--bg:#F7F8FA;--green:#1F9D55;--green-soft:#E6F6EC;--blue:#2563EB;--shadow:0 1px 2px rgba(16,24,40,.04),0 8px 24px rgba(16,24,40,.08);font-family:'Noto Sans JP',system-ui,sans-serif;color:var(--ink)}
.bl-pv .pv-frame{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);overflow:hidden}
.bl-pv .pv-topbar{display:flex;align-items:center;gap:8px;padding:11px 16px;border-bottom:1px solid var(--line);background:var(--bg)}
.bl-pv .pv-topbar .dot{width:10px;height:10px;border-radius:50%;background:#E4E7EB}
.bl-pv .pv-topbar .lbl{margin-left:auto;font-size:11.5px;font-weight:800;color:var(--gray-2);letter-spacing:1px}
.bl-pv .pv-scroll{max-height:calc(100vh - 170px);overflow-y:auto}
.bl-pv .pv-hero{position:relative;height:170px;overflow:hidden;display:flex;align-items:flex-end}
.bl-pv .pv-hero .glow{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(255,90,70,.45),transparent 70%);right:-90px;top:-110px}
.bl-pv .pv-hero .info{position:relative;z-index:2;padding:16px 20px;display:flex;gap:8px;flex-wrap:wrap}
.bl-pv .pv-jcode{font-family:'Inter',monospace;font-size:12px;font-weight:800;letter-spacing:.5px;background:rgba(255,255,255,.94);color:var(--ink);padding:4px 10px;border-radius:7px}
.bl-pv .pv-cont{padding:20px 22px 26px}
.bl-pv .pv-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.bl-pv .pv-pill{display:inline-flex;align-items:center;font-size:12px;font-weight:700;padding:5px 11px;border-radius:20px;background:var(--bg);color:var(--gray)}
.bl-pv .pv-pill.green{background:var(--green-soft);color:var(--green)}
.bl-pv .pv-pill.blue{background:#E8F0FE;color:var(--blue)}
.bl-pv .pv-pill.red{background:#FDECEA;color:var(--red)}
.bl-pv .pv-pill.amber{background:#FFF3E2;color:#E8810C}
.bl-pv .pv-title{font-size:23px;font-weight:900;letter-spacing:-.3px;line-height:1.35;margin:2px 0 4px}
.bl-pv .pv-co{font-size:13.5px;color:var(--gray);font-weight:600;margin-bottom:18px}
.bl-pv .pv-co .muted{color:var(--gray-2)}
.bl-pv .pv-kv{display:grid;grid-template-columns:1fr 1fr;gap:13px 16px;padding:16px 18px;background:var(--bg);border-radius:13px;margin-bottom:22px}
.bl-pv .pv-kv .k{font-size:11px;font-weight:700;color:var(--gray-2);letter-spacing:.3px;margin-bottom:2px}
.bl-pv .pv-kv .v{font-size:14px;font-weight:700;color:var(--ink)}
.bl-pv .pv-kv .v.sal{color:var(--red);font-size:19px;font-weight:900;line-height:1.2}
.bl-pv .pv-kv .v.sub{font-size:11.5px;font-weight:600;color:var(--gray);margin-top:3px}
.bl-pv .pv-kv .full{grid-column:1/-1}
.bl-pv .pv-net{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding:12px 16px;border:1.5px dashed var(--green);border-radius:12px;background:var(--green-soft);margin-bottom:22px}
.bl-pv .pv-net .k{font-size:12px;font-weight:800;color:var(--green)}
.bl-pv .pv-net .v{font-size:20px;font-weight:900;color:var(--green)}
.bl-pv .pv-net .hint{font-size:11px;color:#3a7d5a;width:100%}
.bl-pv .pv-block{margin-bottom:22px}
.bl-pv .pv-block h4{font-size:15px;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.bl-pv .pv-block h4::before{content:'';width:4px;height:15px;background:var(--red);border-radius:3px}
.bl-pv .pv-block p{font-size:13.5px;color:#374151;line-height:1.8;white-space:pre-wrap}
.bl-pv .pv-bullets{list-style:none;display:flex;flex-direction:column;gap:7px;margin:0;padding:0}
.bl-pv .pv-bullets li{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:#374151}
.bl-pv .pv-bullets li::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--red);flex:0 0 auto;margin-top:8px}
.bl-pv .pv-list{list-style:none;display:flex;flex-direction:column;gap:7px;margin:0;padding:0}
.bl-pv .pv-list li{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:#374151}
.bl-pv .pv-list li svg{width:17px;height:17px;flex:0 0 auto;margin-top:3px;color:var(--green)}
.bl-pv .pv-benefits{display:flex;flex-wrap:wrap;gap:7px}
.bl-pv .pv-empty{color:var(--gray-2);font-size:12.5px}
.bl-pv .pv-living{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;font-size:13px}
.bl-pv .pv-living .li{display:flex;flex-direction:column}
.bl-pv .pv-living .li .k{font-size:11px;font-weight:700;color:var(--gray-2)}
.bl-pv .pv-living .li .v{font-weight:700;color:var(--ink)}
.bl-pv .pv-living .full{grid-column:1/-1}
.bl-pv .pv-near{list-style:none;display:flex;flex-direction:column;gap:6px;margin:0;padding:0}
.bl-pv .pv-near li{display:flex;align-items:center;gap:8px;font-size:13px;color:#374151}
.bl-pv .pv-near li svg{width:15px;height:15px;color:var(--red);flex:0 0 auto}
`;

const CK = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>;
const PIN = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;

const yen = (n: number | "") => (n === "" || n == null ? "" : Number(n).toLocaleString("ja-JP"));
const fieldClass = (field: string) => (field.includes("製造") ? "blue" : field.includes("建設") ? "amber" : "green");
const heroBg = (fc: string) => `linear-gradient(120deg,#15171d,${fc === "amber" ? "#46300f" : fc === "blue" ? "#0f2046" : "#0f3320"})`;

export function JobPreview({ s, companyName, code }: { s: JobFormState; companyName: string; code?: string }) {
  const title = s.title.trim() || s.type.trim() || "（求人タイトル未入力）";
  const fc = fieldClass(s.field);
  const jcode = s.code?.trim() || code || `${CODEPREF[s.field] || "JOB"}-001`;
  const recruitLabel = s.recruitStatus === "URGENT" ? "急募" : s.recruitStatus === "CLOSED" ? "終了" : "募集中";
  const recruitColor = s.recruitStatus === "URGENT" ? "#D02E26" : s.recruitStatus === "CLOSED" ? "#6B7280" : "#16A34A";

  const pills: React.ReactNode[] = [];
  if (s.type.trim()) pills.push(<span key="t" className="pv-pill">{s.type}</span>);
  s.tags.forEach((t, i) => pills.push(<span key={"tag" + i} className="pv-pill red">{t}</span>));
  if (s.benefits.includes("寮完備") || s.tags.includes("寮あり")) pills.push(<span key="d" className="pv-pill green">寮あり</span>);
  pills.push(<span key="jp" className="pv-pill blue">日本語 {s.jp}</span>);

  const appeal = s.appeal.map((x) => x.trim()).filter(Boolean);
  const active = s.active.map((x) => x.trim()).filter(Boolean);
  const quals = s.quals.map((x) => x.trim()).filter(Boolean);
  const nearby = s.nearby.map((x) => x.trim()).filter(Boolean);
  const recruitLine = s.recruitTotal !== "" ? `${s.recruitTotal}名（男${s.recruitMale || 0}・女${s.recruitFemale || 0}）` : "—";

  const living: [string, string][] = [
    ["住居タイプ", s.houseType],
    ["部屋", s.room + (s.roommates !== "" ? `・同居 ${s.roommates}人` : "")],
    ["家賃", s.rent !== "" ? yen(s.rent) + "円/月" : "—"],
    ["電気・水道・ガス", s.utility || "—"],
    ["インターネット", s.internet || "—"],
    ["その他実費", s.otherCost || "—"],
  ];
  const empty = (t: string) => <span className="pv-empty">{t}</span>;
  const c = computeSalary(s);

  return (
    <div className="bl-pv">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pv-frame">
        <div className="pv-topbar"><span className="dot" /><span className="dot" /><span className="dot" /><span className="lbl">LIVE PREVIEW ・ 求人票プレビュー</span></div>
        <div className="pv-scroll">
          <div className="pv-hero" style={{ background: heroBg(fc) }}>
            <div className="glow" />
            <div className="info"><span className="pv-jcode">{jcode}</span><span className="pv-jcode" style={{ background: recruitColor, color: "#fff" }}>{recruitLabel}</span><span className={`pv-pill ${fc}`}>{s.field}</span></div>
          </div>
          <div className="pv-cont">
            <div className="pv-tags">{pills.length ? pills : empty("タグ未設定")}</div>
            <h2 className="pv-title">{title}</h2>
            <div className="pv-co">{companyName ? companyName : <span className="muted">企業未選択</span>} ・ {s.pref} {s.city}</div>

            <div className="pv-kv">
              {s.payAmount !== "" ? (
                <div className="full"><div className="k">基本給（{s.payType}）</div><div className="v sal">{yen(s.payAmount)}円</div>{s.payNote && <div className="v sub">{s.payNote}</div>}</div>
              ) : (
                <div className="full"><div className="k">基本給</div><div className="v">{empty("未入力")}</div></div>
              )}
              <div><div className="k">時給</div><div className="v">{c.hourly ? "¥" + yen(c.hourly) : empty("—")}</div></div>
              <div><div className="k">基本給（月額）</div><div className="v">{c.monthlyBase ? "¥" + yen(c.monthlyBase) : empty("—")}</div></div>
              {c.allowanceTotal > 0 && <div><div className="k">手当合計</div><div className="v">¥{yen(c.allowanceTotal)}</div></div>}
              {c.overtimePay > 0 && <div><div className="k">残業代</div><div className="v">¥{yen(c.overtimePay)}</div></div>}
              <div className="full"><div className="k">総支給（月収目安）</div><div className="v sal">{c.gross ? "¥" + yen(c.gross) : empty("—")}</div></div>
              <div><div className="k">募集人数</div><div className="v">{recruitLine}</div></div>
              <div><div className="k">勤務地</div><div className="v">{s.pref} {s.city}</div></div>
              <div><div className="k">日本語</div><div className="v">{s.jp}</div></div>
              <div><div className="k">入社時期</div><div className="v">{s.start}</div></div>
            </div>

            <div className="pv-net"><span className="k">手取り月収（目安）</span><span className="v">{s.takehome !== "" ? yen(s.takehome) + "円" : "—"}</span><span className="hint">税・社会保険を引いた後の金額です。家賃は含まれていません。</span></div>

            <div className="pv-block">
              <h4>募集要項</h4>
              <div className="pv-kv" style={{ marginBottom: 0 }}>
                <div className="full"><div className="k">雇用期間</div><div className="v">{s.term || "—"}</div></div>
                <div><div className="k">勤務時間</div><div className="v">{s.hours || "—"}</div></div>
                <div><div className="k">残業</div><div className="v">{s.overtimeMonthly !== "" ? `月平均${s.overtimeMonthly}時間` : "—"}</div></div>
                <div><div className="k">休日・休暇</div><div className="v">{s.holiday || "—"}</div></div>
                <div><div className="k">通勤手段</div><div className="v">{s.commute || "—"}</div></div>
                <div className="full"><div className="k">賞与・昇給</div><div className="v">{s.bonus || "—"}</div></div>
              </div>
            </div>

            <div className="pv-block">
              <h4>待遇・福利厚生</h4>
              {s.benefits.length ? <div className="pv-benefits">{s.benefits.map((b, i) => <span key={i} className="pv-pill green">{b}</span>)}</div> : empty("未設定")}
            </div>

            <div className="pv-block"><h4>仕事内容</h4>{s.desc.trim() ? <p>{s.desc}</p> : empty("仕事内容を入力してください")}</div>

            <div className="pv-block"><h4>アピールポイント</h4>{appeal.length ? <ul className="pv-bullets">{appeal.map((a, i) => <li key={i}>{a}</li>)}</ul> : empty("未入力")}</div>

            <div className="pv-block"><h4>こんな人が活躍しています</h4>{active.length ? <ul className="pv-bullets">{active.map((a, i) => <li key={i}>{a}</li>)}</ul> : empty("未入力")}</div>

            <div className="pv-block">
              <h4>応募条件</h4>
              <ul className="pv-list">
                <li>{CK}<span>日本語 {s.jp} 程度</span></li>
                <li>{CK}<span>入社できる時期：{s.start}</span></li>
                {quals.map((q, i) => <li key={i}>{CK}<span>{q}</span></li>)}
              </ul>
            </div>

            <div className="pv-block">
              <h4>住居・生活</h4>
              <div className="pv-living">
                {living.map(([k, v], i) => <div key={i} className="li"><span className="k">{k}</span><span className="v">{v}</span></div>)}
                {s.roomDesc && <div className="li full"><span className="k">部屋の説明</span><span className="v">{s.roomDesc}</span></div>}
              </div>
            </div>

            <div className="pv-block"><h4>近隣情報（徒歩15分圏内）</h4>{nearby.length ? <ul className="pv-near">{nearby.map((n, i) => <li key={i}>{PIN}<span>{n}</span></li>)}</ul> : empty("未入力")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
