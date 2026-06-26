import Shell from "@/components/candidate/Shell";
import FbChat from "@/components/candidate/FbChat";
import SiteFooter from "@/components/candidate/SiteFooter";
import { getSessionUser } from "@/lib/auth";

export const metadata = {
  title: "特定技能2号情報｜試験・教材・1号からの移行ガイド｜BIGLIGHT JOB",
  description: "特定技能2号とは何か、対象分野、評価試験・日本語試験の情報、教材・資料、1号から2号への移行方法、よくある質問をまとめた特定技能2号の総合ガイドです。",
};

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-bl-line bg-white p-6 shadow-sm">
      <h2 className="mb-3 border-l-4 border-bl-red pl-3 text-xl font-black">{title}</h2>
      {children}
    </section>
  );
}

const ANCHORS = [
  { href: "#about", label: "特定技能2号とは" },
  { href: "#exam", label: "試験情報" },
  { href: "#materials", label: "教材・資料" },
  { href: "#transition", label: "1号→2号 移行" },
  { href: "#faq", label: "よくある質問" },
];

const FAQ = [
  { q: "特定技能1号と2号は何が違いますか？", a: "2号は在留期間の更新回数に上限がなく、要件を満たせば家族（配偶者・子）の帯同が可能です。将来的に永住申請の道も開けます。" },
  { q: "特定技能2号になるには試験が必要ですか？", a: "各分野の2号評価試験に合格し、一定の実務経験（多くの分野で管理者・班長などの経験）が必要です。分野により要件が異なります。" },
  { q: "日本語試験は必要ですか？", a: "分野によって求められる日本語要件が異なります。詳しくは担当アドバイザーにご相談ください。" },
  { q: "どの分野が2号の対象ですか？", a: "建設・製造・外食・宿泊・農業・介護をはじめ、多くの分野が対象になっています。最新の対象分野はお問い合わせください。" },
];

export default async function Tokutei2Page() {
  const loggedIn = !!(await getSessionUser());
  return (
    <Shell active="tokutei2" loggedIn={loggedIn}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="text-center">
          <div className="text-xs font-black tracking-[0.2em] text-bl-red">SSW No.2</div>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">特定技能2号情報</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-bl-gray">長く日本で働き、家族と暮らす——特定技能2号に関する情報・試験・教材をまとめました。</p>
        </header>

        {/* In-page nav */}
        <nav className="mt-6 flex flex-wrap justify-center gap-2">
          {ANCHORS.map((a) => (
            <a key={a.href} href={a.href} className="rounded-full border border-bl-line bg-white px-3 py-1.5 text-xs font-bold text-bl-gray hover:border-bl-red hover:text-bl-red">{a.label}</a>
          ))}
        </nav>

        <div className="mt-8 space-y-6">
          <Section id="about" title="特定技能2号とは">
            <p className="text-sm leading-loose text-bl-gray">特定技能2号は、特定技能1号よりも熟練した技能を持つ外国人材のための在留資格です。1号との主な違いは次のとおりです。</p>
            <ul className="mt-3 space-y-2 text-sm text-bl-gray">
              <li className="rounded-lg bg-bl-bg p-3"><b className="text-ink">在留期間：</b>更新回数に上限がなく、長期の就労が可能。</li>
              <li className="rounded-lg bg-bl-bg p-3"><b className="text-ink">家族帯同：</b>要件を満たせば配偶者・子の帯同が可能。</li>
              <li className="rounded-lg bg-bl-bg p-3"><b className="text-ink">将来：</b>条件を満たせば永住申請への道も。</li>
            </ul>
          </Section>

          <Section id="exam" title="試験情報">
            <p className="text-sm leading-loose text-bl-gray">特定技能2号になるには、分野ごとの<b className="text-ink">2号評価試験</b>に合格し、必要な実務経験（多くは管理者・班長などの経験）を満たす必要があります。日本語要件は分野により異なります。</p>
            <p className="mt-3 rounded-lg bg-bl-redsoft p-3 text-sm font-semibold text-bl-red">※ 試験日程・要件の詳細は、担当アドバイザーが最新情報をご案内します。</p>
          </Section>

          <Section id="materials" title="教材・資料">
            <p className="text-sm leading-loose text-bl-gray">特定技能2号の学習に役立つ教材・資料を準備しています。</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["2号評価試験 ガイドブック", "分野別 学習テキスト", "日本語学習 資料", "面接・実技 対策資料"].map((m) => (
                <div key={m} className="flex items-center justify-between rounded-xl border border-bl-line bg-bl-bg p-3 text-sm">
                  <span className="font-semibold">{m}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-bl-gray2">準備中</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="transition" title="1号 → 2号 移行ガイド">
            <ol className="space-y-3">
              {[
                ["要件の確認", "現在の在留資格・実務経験・分野が2号の要件を満たすか確認します。"],
                ["試験の準備・受験", "分野の2号評価試験（必要に応じて日本語試験）に向けて学習し、受験します。"],
                ["書類準備", "実務経験証明・雇用契約など必要書類をBIGLIGHTがサポートします。"],
                ["在留資格変更申請", "入管へ特定技能2号への変更を申請します。"],
                ["許可・継続就労", "許可後は更新上限なしで就労、要件を満たせば家族帯同も。"],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-bl-red text-sm font-black text-white">{i + 1}</span>
                  <div><b className="text-sm">{t}</b><p className="text-sm text-bl-gray">{d}</p></div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="faq" title="よくある質問">
            <div className="space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="rounded-xl border border-bl-line bg-bl-bg p-4">
                  <summary className="cursor-pointer text-sm font-bold">{f.q}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-bl-gray">{f.a}</p>
                </details>
              ))}
            </div>
          </Section>
        </div>
      </div>
      <SiteFooter />
      <FbChat />
    </Shell>
  );
}
