import Shell from "@/components/candidate/Shell";
import FbChat from "@/components/candidate/FbChat";
import SiteFooter from "@/components/candidate/SiteFooter";

export const metadata = {
  title: "私たちについて｜キャリアアドバイザー紹介・体験談｜BIGLIGHT JOB",
  description: "BIGLIGHT JOBのキャリアアドバイザーをご紹介します。母国語で寄り添い、一人ひとりに合った特定技能の求人をご提案。先輩たちの成功体験談も掲載しています。",
};

const ADVISORS = [
  {
    name: "Nguyễn Hoàng Phương An",
    role: "キャリアアドバイザー",
    img: "/team/an.jpg",
    bio: "人と話すこと、そして一人ひとりの応募者のお話を聞くことが大好きです。カウンセリングでは、これまでの経験や希望をしっかり理解し、あなたに一番合ったお仕事をご紹介できるよう心がけています。日本での仕事や生活に不安があれば、いつでもお気軽にご相談ください。",
  },
  {
    name: "Lê Nhật Minh",
    role: "建設分野キャリアアドバイザー",
    img: "/team/minh.jpg",
    bio: "建設分野のお仕事を担当しています。ご希望に合った求人選びのサポートはもちろん、ライブ配信を通じて現場のリアルな情報や経験もお伝えしています。応募前の準備に、少しでもお役に立てればうれしいです。",
  },
  {
    name: "Lê Trần Thảo Nguyên",
    role: "キャリアアドバイザー",
    img: "/team/nguyen.jpg",
    bio: "日本語と、人をサポートするこの仕事が大好きです。応募者の方にはそれぞれ違った強みがあります。だからこそ、一人ひとりの能力と目標に合った求人をご紹介できるよう努めています。日本でのお仕事探しを、たくさんの方と一緒に歩んでいけたら幸いです。",
  },
];

const STORIES = [
  { name: "Aさん・24歳（ベトナム）", meta: "工業製品製造業 / 愛知県", img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=700&q=80", quote: "未経験から溶接の仕事へ。担当者が面接の準備まで手伝ってくれて、寮完備で初期費用もほぼゼロ。今は安定して働けています。" },
  { name: "Bさん・27歳", meta: "建設業 / 岐阜県", img: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=700&q=80", quote: "実習生から特定技能へ。たくさんの求人から選べて、希望どおりの会社に入れました。給料も上がり、家族に仕送りもできています。" },
  { name: "Cさん・23歳（女性）", meta: "飲食料品製造業 / 三重県", img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=700&q=80", quote: "女性専用寮があって安心。日本語が不安でしたが、サポートのおかげでスムーズに入社できました。" },
];

export default function AboutPage() {
  return (
    <Shell active="about">
      {/* Intro */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF6F2] via-[#FFEDE6] to-[#FFE0D6]">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-bl-red/10 blur-3xl" />
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-bl-amber/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="text-xs font-black tracking-[0.2em] text-bl-red">ABOUT US</div>
          <h1 className="mt-2 text-3xl font-black leading-tight text-ink sm:text-5xl">あなたの「日本で働く」を、<br /><span className="text-bl-red">本気で</span>応援するチーム。</h1>
          <p className="mx-auto mt-4 max-w-2xl text-bl-gray">登録から入社後まで、母国語で寄り添うBIGLIGHTのキャリアアドバイザーをご紹介します。🎌</p>
        </div>
      </section>

      {/* Advisors — zigzag */}
      <section className="mx-auto max-w-5xl space-y-16 px-6 py-16 sm:space-y-24">
        {ADVISORS.map((a, i) => (
          <div key={a.name} className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
            {/* Photo */}
            <div className={`relative mx-auto w-full max-w-sm ${i % 2 === 1 ? "sm:order-2" : ""}`}>
              <div className={`absolute h-40 w-40 rounded-full blur-2xl ${i % 2 ? "-bottom-6 -left-6 bg-bl-amber/25" : "-right-6 -top-6 bg-bl-red/20"}`} />
              <img src={a.img} alt={a.name} className="relative aspect-[4/5] w-full rounded-[2.2rem] object-cover shadow-xl ring-4 ring-white" />
              <span className="absolute bottom-4 left-4 rounded-full bg-bl-red px-3 py-1 text-xs font-black text-white shadow-lg">{a.role}</span>
            </div>
            {/* Text */}
            <div className={i % 2 === 1 ? "sm:order-1" : ""}>
              <div className="text-xs font-black tracking-[0.2em] text-bl-red">ADVISOR 0{i + 1}</div>
              <h2 className="mt-1 flex items-center gap-2 text-2xl font-black sm:text-3xl">{a.name}<span className="text-2xl" title="ベトナム">🇻🇳</span></h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-bl-redsoft px-3 py-1 text-sm font-bold text-bl-red">{a.role}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-bl-bg px-2.5 py-1 text-xs font-bold text-bl-gray">🇻🇳 ベトナム</span>
              </div>
              <p className="mt-5 text-[15px] leading-loose text-bl-gray">{a.bio}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Success stories */}
      <section className="bg-bl-bg py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs font-black tracking-[0.2em] text-bl-red">SUCCESS STORIES</div>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">先輩たちの声</h2>
            <p className="mt-2 text-sm text-bl-gray">たくさんの求人から選んで、希望の会社へ。先輩たちのリアルな体験談です。</p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STORIES.map((s) => (
              <article key={s.name} className="overflow-hidden rounded-3xl border border-bl-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <img src={s.img} alt="" className="h-40 w-full object-cover" />
                <div className="p-5">
                  <b className="text-sm">{s.name}</b>
                  <div className="text-xs text-bl-gray2">{s.meta}</div>
                  <div className="mt-1.5 text-bl-amber">★★★★★</div>
                  <p className="mt-2 text-sm leading-relaxed text-bl-gray">「{s.quote}」</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-bl-gray2">※ 体験談は一例です。写真はイメージです。</p>
        </div>
      </section>

      <SiteFooter />
      <FbChat />
    </Shell>
  );
}
