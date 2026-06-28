import Link from "next/link";
import { COMPANY, CONTACT_EMAIL } from "@/lib/site";
import Logo from "./Logo";

const BIGLIGHT_SITE = "https://biglight.jp/";

// Cột sitemap dùng chung
function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2.5 text-[13px] font-bold text-white">{title}</h2>
      <div className="flex flex-col gap-1.5 text-[13px]">{children}</div>
    </div>
  );
}
const FLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-white/65 transition hover:text-white">{children}</Link>
);

export default function SiteFooter({ loggedIn = false }: { loggedIn?: boolean }) {
  return (
    <footer className="bg-[#16181D] text-sm text-white/70">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Brand + Sitemap */}
        <div className="grid gap-10 lg:grid-cols-[1.25fr_2fr]">
          <div>
            <div className="flex items-center gap-2"><Logo size={34} /><span className="text-[17px] font-black text-white">BIGLIGHT<span className="text-bl-red"> JOB</span></span></div>
            <p className="mt-3 max-w-xs leading-relaxed text-white/60">特定技能・育成就労の外国人材のための求人サイト。寮あり・未経験OK・ビザサポートつきの仕事を無料でご紹介します。</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{COMPANY.licenses.map((l) => <span key={l} className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/70">{l}</span>)}</div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Col title="求人を探す">
              <FLink href="/jobs">特定技能 求人一覧</FLink>
              <FLink href="/jobs">製造業の求人</FLink>
              <FLink href="/jobs">建設業の求人</FLink>
              <FLink href="/jobs">介護・外食・農業 ほか</FLink>
            </Col>
            <Col title="特定技能ガイド">
              <FLink href="/guide">ガイド一覧</FLink>
              <FLink href="/guide">ビザ・在留資格</FLink>
              <FLink href="/guide">面接・履歴書</FLink>
              <FLink href="/tokutei2">特定技能2号情報</FLink>
            </Col>
            <Col title="会社・サポート">
              <FLink href="/about">私たちについて</FLink>
              <FLink href="/info">特定技能ガイド（紹介）</FLink>
              <FLink href="/privacy-policy">プライバシーポリシー</FLink>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-white/65 transition hover:text-white">お問い合わせ</a>
            </Col>
            <Col title="アカウント">
              {loggedIn
                ? <FLink href="/mypage">マイページ</FLink>
                : <Link href="/mypage" className="font-bold text-bl-red transition hover:text-white">30秒で無料登録</Link>}
              <FLink href="/mypage">ログイン</FLink>
            </Col>
          </div>
        </div>

        {/* 運営会社 — link về trang chủ BIGLIGHT株式会社 */}
        <div className="mt-10 flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-bl-red">運営会社</div>
            <div className="mt-1 text-lg font-black text-white">{COMPANY.name}</div>
            <p className="mt-1 text-xs leading-relaxed text-white/55">{COMPANY.postal} {COMPANY.address}<br />TEL: {COMPANY.tel}</p>
          </div>
          <a href={BIGLIGHT_SITE} target="_blank" rel="noopener noreferrer"
            className="inline-flex flex-none items-center justify-center gap-2 rounded-xl bg-bl-red px-5 py-3 text-sm font-black text-white shadow-lg ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-bl-redd hover:shadow-xl">
            BIGLIGHT株式会社 公式サイト
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </a>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 {COMPANY.name} — 特定技能・育成就労の外国人材求人サイト</span>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-white/80">プライバシーポリシー</Link>
            <a href={BIGLIGHT_SITE} target="_blank" rel="noopener noreferrer" className="hover:text-white/80">運営会社</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
