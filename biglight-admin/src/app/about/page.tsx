import Shell from "@/components/candidate/Shell";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import SiteFooter from "@/components/candidate/SiteFooter";
import { Reveal } from "@/components/candidate/Reveal";
import { getSessionUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/about",
  title: "私たちについて｜サポートの流れ・キャリアアドバイザー紹介｜BIGLIGHT JOB",
  description: "BIGLIGHTの目標と、求人紹介から入社後フォローまでの8ステップのサポートの流れをご紹介します。一人ひとりの能力・経験・希望に合った仕事をマッチングします。",
});

// SVG line icon (không dùng emoji)
const Ic = ({ d, size = 22 }: { d: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const STEPS: { title: string; desc: string; icon: React.ReactNode }[] = [
  { title: "求人のご紹介", desc: "ご希望の条件や経験をヒアリングし、最適な求人をご紹介します。", icon: <><path d="M3 5h12M3 10h12M3 15h7" /><circle cx="18" cy="16" r="3.2" /><path d="m22 20.5-1.6-1.6" /></> },
  { title: "BIGLIGHT面談", desc: "担当スタッフが面談を行い、日本語レベルや職歴、スキル、希望条件を確認します。", icon: <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" /> },
  { title: "履歴書・職務経歴書作成（無料）", desc: "企業ごとのポイントに合わせて無料で作成・添削します。", icon: <><path d="M14 3v5h5" /><path d="M16 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="M16 21l5-5-2-2-5 5v2z" /></> },
  { title: "面接練習", desc: "企業に合わせた模擬面接を実施し、自信を持って面接に臨めるようサポートします。", icon: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></> },
  { title: "企業面接", desc: "担当スタッフが面接日程の調整から当日の同行までサポートします。", icon: <><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" /><path d="M7 11h.01M12 11h.01M17 11h.01" /></> },
  { title: "採用・ビザ申請", desc: "採用決定後はビザ担当へ引き継ぎ、必要書類や申請手続きをサポートします。", icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 11.5 2 2 4-4" /></> },
  { title: "入社準備", desc: "寮の案内、住所登録、ライフラインなど、新生活の準備をサポートします。", icon: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></> },
  { title: "入社後フォロー", desc: "入社後も定期的に連絡を取り、仕事や生活の相談に対応します。", icon: <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z" /> },
];

const ADVISORS = [
  { name: "グエン・ホアン・フォン・アン", role: "キャリアアドバイザー", img: "/team/an.jpg", bio: "人と話すこと、そして一人ひとりの応募者のお話を聞くことが大好きです。カウンセリングでは、これまでの経験や希望をしっかり理解し、あなたに一番合ったお仕事をご紹介できるよう心がけています。日本での仕事や生活に不安があれば、いつでもお気軽にご相談ください。" },
  { name: "レー・ニャット・ミン", role: "建設分野キャリアアドバイザー", img: "/team/minh.jpg", bio: "建設分野のお仕事を担当しています。ご希望に合った求人選びのサポートはもちろん、ライブ配信を通じて現場のリアルな情報や経験もお伝えしています。応募前の準備に、少しでもお役に立てればうれしいです。" },
  { name: "レー・チャン・タオ・グエン", role: "キャリアアドバイザー", img: "/team/nguyen.jpg", bio: "日本語と、人をサポートするこの仕事が大好きです。応募者の方にはそれぞれ違った強みがあります。だからこそ、一人ひとりの能力と目標に合った求人をご紹介できるよう努めています。日本でのお仕事探しを、たくさんの方と一緒に歩んでいけたら幸いです。" },
];

const Hl = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-md bg-bl-redsoft px-1.5 font-black text-bl-red">{children}</span>
);

export default async function AboutPage() {
  const loggedIn = (await getSessionUser())?.role === "CANDIDATE";
  return (
    <Shell active="about" loggedIn={loggedIn}>
      {/* ===== Hero ===== */}
      <section className="border-b border-bl-line bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <div className="text-xs font-black tracking-[0.25em] text-bl-red">ABOUT US</div>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-[40px]">仕事探しから入社後まで、<br /><span className="text-bl-red">最後まで</span>一緒に歩みます。</h1>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-bl-gray">登録から入社後のフォローまで、母国語で寄り添うBIGLIGHTのサポート体制をご紹介します。</p>
        </div>
      </section>

      {/* ===== ① 私たちの目標 ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-bl-line bg-white p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-bl-redsoft text-bl-red">
                <Ic size={30} d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.6" /></>} />
              </div>
              <div className="text-xs font-black tracking-[0.2em] text-bl-red">OUR MISSION</div>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">私たちの目標</h2>
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-loose text-bl-gray sm:text-base">
                一人ひとりの<Hl>能力</Hl>・<Hl>経験</Hl>・<Hl>希望</Hl>に合った仕事を<Hl>マッチング</Hl>し、安心して<Hl>長く働ける</Hl>環境を提供することです。
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== ② BIGLIGHTサポートの流れ ===== */}
      <section className="bg-bl-bg">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <div className="text-xs font-black tracking-[0.2em] text-bl-red">SUPPORT FLOW</div>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">BIGLIGHTサポートの流れ</h2>
            <p className="mt-3 text-sm text-bl-gray">求人のご紹介から入社後のフォローまで、8つのステップでサポートします。</p>
          </div>

          {/* Timeline */}
          <ol className="relative mt-12 space-y-5 sm:space-y-6">
            {/* đường dọc */}
            <span className="absolute left-[27px] top-3 bottom-3 w-px bg-bl-line sm:left-[31px]" aria-hidden />
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 60}>
                <li className="relative flex gap-4 sm:gap-5">
                  {/* số + icon */}
                  <div className="relative z-10 flex-none">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-bl-red to-bl-redd text-white shadow-md sm:h-16 sm:w-16">
                      <Ic size={22} d={s.icon} />
                      <span className="mt-0.5 text-[9px] font-black tracking-wide opacity-90">STEP {i + 1}</span>
                    </div>
                  </div>
                  {/* card */}
                  <div className="flex-1 rounded-2xl border border-bl-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                    <div className="text-[11px] font-black tracking-wider text-bl-red">STEP {i + 1}</div>
                    <h3 className="mt-0.5 text-base font-black text-ink sm:text-lg">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-bl-gray">{s.desc}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== ③ 面接に不合格でも安心 ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <Reveal>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-bl-red to-bl-redd p-8 text-center text-white shadow-lg sm:p-12">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30">
                <Ic size={30} d={<><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></>} />
              </div>
              <h2 className="text-2xl font-black sm:text-3xl">面接に不合格でも安心</h2>
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-loose text-white/95 sm:text-base">
                不合格で終わりではありません。BIGLIGHTでは、一人ひとりの経験や希望に合わせて次の求人をご紹介します。就職が決まるまで責任を持ってサポートします。
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Advisors ===== */}
      <section className="border-t border-bl-line bg-bl-bg">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <div className="text-xs font-black tracking-[0.2em] text-bl-red">ADVISORS</div>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">キャリアアドバイザー紹介</h2>
            <p className="mt-3 text-sm text-bl-gray">母国語で寄り添う、私たちのアドバイザーです。</p>
          </div>
          <div className="mt-12 space-y-14 sm:space-y-20">
            {ADVISORS.map((a, i) => (
              <Reveal key={a.name}>
                <div className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
                  <div className={`relative mx-auto w-full max-w-sm ${i % 2 === 1 ? "sm:order-2" : ""}`}>
                    <img src={a.img} alt={a.name} className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-lg ring-4 ring-white" />
                    <span className="absolute bottom-4 left-4 rounded-full bg-bl-red px-3 py-1 text-xs font-black text-white shadow-lg">{a.role}</span>
                  </div>
                  <div className={i % 2 === 1 ? "sm:order-1" : ""}>
                    <div className="text-xs font-black tracking-[0.2em] text-bl-red">ADVISOR 0{i + 1}</div>
                    <h3 className="mt-1 text-2xl font-black text-ink sm:text-3xl">{a.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-bl-redsoft px-3 py-1 text-sm font-bold text-bl-red">{a.role}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-bl-gray ring-1 ring-bl-line">ベトナム</span>
                    </div>
                    <p className="mt-5 text-[15px] leading-loose text-bl-gray">{a.bio}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
      <MessengerPopupButton />
    </Shell>
  );
}
