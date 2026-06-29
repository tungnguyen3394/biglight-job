import Shell from "@/components/candidate/Shell";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import SiteFooter from "@/components/candidate/SiteFooter";
import { getSessionUser } from "@/lib/auth";

export const metadata = {
  title: "特定技能ガイド｜ビザ・日本の生活・仕事の情報｜BIGLIGHT JOB",
  description: "特定技能ビザの申請、日本での生活費や住まい、面接対策など、日本で働く外国人材に役立つ情報をやさしく解説する特定技能ガイドです。",
};

type Cat = "ビザ" | "生活" | "仕事";
const CAT_CLS: Record<Cat, string> = {
  ビザ: "bg-bl-bluesoft text-bl-blue",
  生活: "bg-bl-greensoft text-bl-green",
  仕事: "bg-bl-ambersoft text-bl-amber",
};

// Khung bài viết mẫu — sửa/ thêm nội dung sau.
const ARTICLES: { cat: Cat; title: string; excerpt: string }[] = [
  { cat: "ビザ", title: "特定技能ビザとは？申請の流れをやさしく解説", excerpt: "特定技能1号・2号の違い、必要な試験、申請に必要な書類と手続きの流れをわかりやすくまとめました。" },
  { cat: "ビザ", title: "技能実習から特定技能へ移行する方法", excerpt: "実習修了予定の方へ。移行に必要な条件・タイミング・準備すべき書類を解説します。" },
  { cat: "生活", title: "日本での生活費はいくら？家賃・光熱費の目安", excerpt: "寮あり求人を選ぶとどれくらい節約できる？手取りから引かれる毎月の固定費を具体例で紹介。" },
  { cat: "生活", title: "日本の銀行口座・携帯電話の作り方", excerpt: "来日後すぐに必要な手続き。必要なものと、つまずきやすいポイントをチェックリストで。" },
  { cat: "仕事", title: "未経験から始める製造の仕事｜1日の流れ", excerpt: "溶接・組立・検査など、製造現場の1日のスケジュールと、未経験者へのサポート体制を紹介。" },
  { cat: "仕事", title: "面接でよく聞かれる質問と答え方", excerpt: "志望動機・経験・将来の希望。日本語が不安でも大丈夫。準備しておきたい受け答えのコツ。" },
];

export default async function InfoPage() {
  const loggedIn = (await getSessionUser())?.role === "CANDIDATE";
  return (
    <Shell active="info" loggedIn={loggedIn}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="text-center">
          <div className="text-xs font-black tracking-widest text-bl-red">特定技能ガイド</div>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">特定技能ガイド</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-bl-gray">特定技能ビザ・日本の生活・仕事のことを、やさしく解説します。</p>
        </header>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a) => (
            <article key={a.title} className="flex flex-col rounded-2xl border border-bl-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-bold ${CAT_CLS[a.cat]}`}>{a.cat}</span>
              <h2 className="mt-3 text-base font-bold leading-snug">{a.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-bl-gray">{a.excerpt}</p>
              <span className="mt-4 text-sm font-bold text-bl-red">準備中（近日公開）</span>
            </article>
          ))}
        </div>
      </div>
      <SiteFooter />
      <MessengerPopupButton />
    </Shell>
  );
}
