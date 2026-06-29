import Shell from "@/components/candidate/Shell";
import type { NavActive } from "@/components/candidate/SiteHeader";
import SiteFooter from "@/components/candidate/SiteFooter";
import MessengerPopupButton from "@/components/common/MessengerPopupButton";
import { getSessionUser } from "@/lib/auth";

export const metadata = {
  title: "プライバシーポリシー｜BIGLIGHT JOB",
  description: "BIGLIGHT JOBのプライバシーポリシー。取得する情報、利用目的、第三者提供、Cookieの利用、Google・Facebookログインについて記載しています。",
};

export const dynamic = "force-dynamic";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-9 border-l-4 border-bl-red pl-3 text-lg font-black text-ink">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 text-[15px] font-bold text-ink">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[14px] leading-loose text-bl-gray">{children}</p>;
}
function UL({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-[14px] leading-relaxed text-bl-gray">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bl-red" />
          {t}
        </li>
      ))}
    </ul>
  );
}

export default async function PrivacyPolicyPage() {
  const loggedIn = (await getSessionUser())?.role === "CANDIDATE";
  return (
    <Shell active={"" as NavActive} loggedIn={loggedIn}>
      <article className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="text-xs font-black tracking-[0.2em] text-bl-red">PRIVACY POLICY</div>
        <h1 className="mt-2 text-3xl font-black text-ink">プライバシーポリシー</h1>
        <p className="mt-2 text-xs text-bl-gray2">最終更新日：2026年6月27日</p>

        <P>
          BIGLIGHT株式会社（以下、「当社」といいます）は、当社が運営する「BIGLIGHT JOB」（以下、「本サービス」といいます）において、利用者の個人情報を適切に取り扱うため、以下のとおりプライバシーポリシーを定めます。
        </P>

        <H2>1. 取得する情報</H2>
        <P>当社は、本サービスをご利用いただく際、以下の情報を取得する場合があります。</P>
        <H3>Googleログイン・Facebookログインの場合</H3>
        <P>ログイン時に取得する情報は以下のとおりです。</P>
        <UL items={["氏名", "メールアドレス", "プロフィール画像（取得可能な場合）", "GoogleまたはFacebookのユーザーID"]} />
        <P>当社が取得する情報は、利用者が認証時に許可した範囲に限られます。</P>

        <H2>2. 利用目的</H2>
        <P>取得した情報は以下の目的で利用します。</P>
        <UL items={["本サービスへのログイン認証", "アカウントの作成・管理", "求人応募および応募履歴の管理", "本人確認", "お問い合わせ対応", "サービス改善・品質向上", "不正利用防止", "法令に基づく対応"]} />

        <H2>3. 第三者提供</H2>
        <P>当社は、以下の場合を除き、取得した個人情報を第三者へ提供いたしません。</P>
        <UL items={["本人の同意がある場合", "法令に基づく場合", "人の生命・身体・財産保護のため必要な場合"]} />

        <H2>4. 情報の保存</H2>
        <P>取得した個人情報は、安全に管理し、不正アクセス、漏えい、改ざん等の防止に努めます。</P>

        <H2>5. 外部サービス</H2>
        <P>本サービスでは以下の外部サービスを利用しています。</P>
        <UL items={["Google OAuth", "Meta（Facebook Login）"]} />
        <P>これらのサービスは各社のプライバシーポリシーに従って情報を管理します。</P>

        <H2>6. Cookie等の利用</H2>
        <P>本サービスでは、ログイン状態の維持やサービス向上のためCookie等の技術を利用する場合があります。</P>
        <P>利用者はブラウザの設定によりCookieを無効化できますが、一部機能をご利用いただけない場合があります。</P>

        <H2>7. 個人情報の開示・訂正・削除</H2>
        <P>利用者は、ご本人の個人情報について、開示・訂正・削除を希望される場合は、下記窓口までお問い合わせください。</P>
        <P>本人確認後、速やかに対応いたします。</P>

        <H2>8. プライバシーポリシーの変更</H2>
        <P>本ポリシーは必要に応じて変更する場合があります。</P>
        <P>重要な変更については、本サービス上でお知らせします。</P>

        <H2>9. お問い合わせ</H2>
        <div className="mt-3 rounded-2xl border border-bl-line bg-bl-bg p-4 text-[14px] leading-loose text-bl-gray">
          <div className="font-bold text-ink">BIGLIGHT株式会社</div>
          <div>〒462-0007</div>
          <div>愛知県名古屋市北区如一丁目１１２番地 A</div>
          <div className="mt-1">Email：<a href="mailto:n-tung@biglight.jp" className="font-semibold text-bl-blue hover:underline">n-tung@biglight.jp</a></div>
          <div>TEL：<a href="tel:0529087944" className="font-semibold text-bl-blue hover:underline">052-908-7944</a></div>
        </div>

        <H2>Google・Facebookログインについて</H2>
        <P>GoogleまたはFacebookでログインした場合、当社は認証に必要な範囲の情報（氏名・メールアドレス・プロフィール画像等）を取得します。</P>
        <P>取得した情報は、以下の目的以外には利用いたしません。</P>
        <UL items={["アカウント作成", "ログイン認証", "求人応募機能", "サービス運営"]} />
        <P>また、Google・Facebookのパスワードを当社が取得・保存することはありません。</P>
      </article>

      <SiteFooter />
      <MessengerPopupButton />
    </Shell>
  );
}
