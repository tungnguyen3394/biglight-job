"use client";

import { useState } from "react";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

function NumIn({ label, hint, value, onChange, tag }: { label: string; hint?: string; value: number; onChange: (v: number) => void; tag?: { text: string; cls: string } }) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center gap-2">
        <label className="text-sm font-bold">{label}</label>
        {tag && <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tag.cls}`}>{tag.text}</span>}
      </div>
      {hint && <p className="mb-1.5 text-xs text-bl-gray2">{hint}</p>}
      <div className="flex items-center gap-1">
        <input type="number" inputMode="numeric" value={value || ""} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-full rounded-xl border border-bl-line px-3 py-2.5 text-right text-sm font-bold outline-none focus:border-bl-red" />
        <span className="text-sm text-bl-gray">円</span>
      </div>
    </div>
  );
}

export default function SalaryCalc() {
  const [kyu, setKyu] = useState(200000);
  const [zan, setZan] = useState(0);
  const [kotsu, setKotsu] = useState(0);
  const [fuyou, setFuyou] = useState(0);
  const [jumin, setJumin] = useState(0);
  const [kaigo, setKaigo] = useState(false);
  const [yachin, setYachin] = useState(0);
  const [kounetsu, setKounetsu] = useState(0);
  const [net, setNet] = useState(0);

  const sokyu = kyu + zan + kotsu;
  const kenko = sokyu * 0.049;
  const nenkin = sokyu * 0.0915;
  const koyo = sokyu * 0.006;
  const kaigoAmt = kaigo ? sokyu * 0.009 : 0;
  const shaho = kenko + nenkin + koyo + kaigoAmt;
  const kazei = Math.max(0, kyu + zan - shaho);
  const shotoku = Math.max(0, (kazei - 88000 - fuyou * 31700) * 0.05105);
  const tedori = sokyu - shaho - shotoku - jumin;
  const jisshitsu = tedori - yachin - kounetsu - net;

  const rows: [string, number][] = [
    ["総支給額", sokyu],
    ["健康保険", -kenko],
    ...(kaigo ? [["介護保険", -kaigoAmt] as [string, number]] : []),
    ["厚生年金", -nenkin],
    ["雇用保険", -koyo],
    ["所得税（概算）", -shotoku],
    ["住民税", -jumin],
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-black">手取り計算ツール</h1>
      <p className="mt-1 text-sm text-bl-gray">額面から、実際に受け取る「手取り」を計算します。</p>

      {/* Inputs */}
      <div className="mt-5 rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
        <NumIn label="月給（基本給）" value={kyu} onChange={setKyu} tag={{ text: "課税", cls: "bg-bl-redsoft text-bl-red" }} />
        <NumIn label="残業代（月）" value={zan} onChange={setZan} tag={{ text: "課税", cls: "bg-bl-redsoft text-bl-red" }} />
        <NumIn label="交通費（月）" hint="通勤手当。所得税はかかりません" value={kotsu} onChange={setKotsu} tag={{ text: "非課税", cls: "bg-bl-greensoft text-bl-green" }} />
        <div className="mb-4">
          <label className="mb-1 block text-sm font-bold">扶養人数</label>
          <input type="number" inputMode="numeric" value={fuyou || ""} onChange={(e) => setFuyou(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-xl border border-bl-line px-3 py-2.5 text-right text-sm font-bold outline-none focus:border-bl-red" />
        </div>
        <NumIn label="住民税（月額）" hint="前年の所得で決まります。1年目はかからない場合あり" value={jumin} onChange={setJumin} />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={kaigo} onChange={(e) => setKaigo(e.target.checked)} className="h-4 w-4 accent-bl-red" />
          介護保険あり（40〜64歳）
        </label>
      </div>

      {/* Result ① */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-bl-red to-bl-redd p-5 text-center text-white shadow-lg">
        <div className="text-sm text-white/85">① 手取り月収（税・社会保険を引いた後）</div>
        <div className="mt-1 text-3xl font-black">{yen(tedori)}</div>
      </div>

      {/* Breakdown */}
      <div className="mt-4 rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-black">内訳</h2>
        <div className="divide-y divide-bl-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-2">
              <span className="text-bl-gray">{k}</span>
              <span className={v < 0 ? "font-semibold text-bl-red" : "font-bold"}>{v < 0 ? `−${yen(-v)}` : yen(v)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2.5"><span className="font-black">① 手取り月収</span><span className="font-black text-bl-red">{yen(tedori)}</span></div>
        </div>
      </div>

      {/* Living costs → ② */}
      <div className="mt-4 rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-black">② 実質受取額（生活費を引いた後）</h2>
        <p className="mb-3 text-xs text-bl-gray">手取りからさらに引かれる毎月の固定費</p>
        <NumIn label="家賃・寮費" value={yachin} onChange={setYachin} />
        <NumIn label="光熱費" value={kounetsu} onChange={setKounetsu} />
        <NumIn label="インターネット代" value={net} onChange={setNet} />
        <div className="mt-2 rounded-xl bg-bl-greensoft p-4 text-center">
          <div className="text-sm text-bl-green">② 実質受取額</div>
          <div className="mt-1 text-2xl font-black text-bl-green">{yen(jisshitsu)}</div>
        </div>
      </div>

      {/* Explanation */}
      <details className="mt-4 rounded-2xl border border-bl-line bg-white p-5 text-sm shadow-sm">
        <summary className="cursor-pointer font-black">計算方法</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-bl-gray">
          <li><b>社会保険料</b> ＝ 総支給額 ×（健康保険4.9％＋厚生年金9.15％＋雇用保険0.6％〔＋介護0.9％〕）</li>
          <li><b>所得税の課税対象</b> ＝（月給＋残業代）− 社会保険料（交通費は非課税）</li>
          <li><b>所得税（概算）</b> ＝（課税対象 − 88,000 − 扶養×31,700）× 5.105％</li>
          <li><b>① 手取り月収</b> ＝ 総支給額 − 社会保険料 − 所得税 − 住民税</li>
          <li><b>② 実質受取額</b> ＝ 手取り月収 − 家賃 − 光熱費 − ネット代</li>
        </ul>
        <p className="mt-3 text-xs text-bl-gray2">※ 概算です。実際は会社・自治体・契約により異なります。</p>
      </details>
    </div>
  );
}
