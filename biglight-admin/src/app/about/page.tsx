import Shell from "@/components/candidate/Shell";
import FbChat from "@/components/candidate/FbChat";
import SiteFooter from "@/components/candidate/SiteFooter";
import { TEAM, STORIES } from "@/lib/site";

export const metadata = {
  title: "私たちについて｜サポートチーム・先輩の体験談｜BIGLIGHT JOB",
  description: "BIGLIGHT JOBの専属サポーター（母国語対応の相談員チーム）と、特定技能で活躍する先輩たちの体験談をご紹介します。登録から入社後まで安心のサポート体制。",
};

export default function AboutPage() {
  return (
    <Shell active="about">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="text-center">
          <div className="text-xs font-black tracking-widest text-bl-red">ABOUT US</div>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">私たちについて</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-bl-gray">登録から入社後まで、母国語で寄り添うBIGLIGHTのサポート体制をご紹介します。</p>
        </header>

        {/* SUPPORT TEAM */}
        <section className="mt-10">
          <div className="text-center">
            <div className="text-xs font-black tracking-widest text-bl-red">SUPPORT TEAM</div>
            <h2 className="mt-1 text-xl font-black">あなたの専属サポーター</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m) => (
              <div key={m.name} className="overflow-hidden rounded-2xl border border-bl-line bg-white shadow-sm">
                <div className="relative h-44"><img src={m.img} alt="" className="h-full w-full object-cover" /><span className="absolute right-2 top-2 rounded-full bg-bl-green px-2 py-0.5 text-[11px] font-bold text-white">対応可能</span></div>
                <div className="p-4">
                  <h3 className="font-bold">{m.name}</h3>
                  <div className="text-xs text-bl-gray2">{m.rom}</div>
                  <div className="mt-1 text-sm font-semibold text-bl-red">{m.role}</div>
                  <div className="mt-2 flex flex-wrap gap-1">{m.langs.map((l) => <span key={l} className="rounded bg-bl-bg px-2 py-0.5 text-[11px] text-bl-gray">{l}</span>)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SUCCESS STORIES */}
        <section className="mt-12">
          <div className="text-center">
            <div className="text-xs font-black tracking-widest text-bl-red">SUCCESS STORIES</div>
            <h2 className="mt-1 text-xl font-black">先輩たちの声</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {STORIES.map((s) => (
              <div key={s.name} className="rounded-2xl border border-bl-line bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3"><img src={s.img} alt="" className="h-11 w-11 rounded-full object-cover" /><div><b className="text-sm">{s.name}</b><div className="text-xs text-bl-gray2">{s.meta}</div></div></div>
                <div className="mt-2 text-bl-amber">★★★★★</div>
                <p className="mt-2 text-sm leading-relaxed text-bl-gray">「{s.quote}」</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
      <FbChat />
    </Shell>
  );
}
