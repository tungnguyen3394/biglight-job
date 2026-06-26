import Link from "next/link";
import { COMPANY } from "@/lib/site";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="bg-[#16181D] py-12 text-sm text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2"><Logo size={32} /><span className="font-black text-white">BIGLIGHT<span className="text-bl-red"> JOB</span></span></div>
          <p className="mt-3 leading-relaxed">{COMPANY.name}<br />{COMPANY.postal} {COMPANY.address}<br />TEL: {COMPANY.tel}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{COMPANY.licenses.map((l) => <span key={l} className="rounded bg-white/10 px-2 py-0.5 text-[11px]">{l}</span>)}</div>
        </div>
        <div><h2 className="mb-2 font-bold text-white">メニュー</h2><div className="flex flex-col gap-1"><Link href="/" className="hover:text-white">求人を探す</Link><Link href="/about" className="hover:text-white">私たちについて</Link><Link href="/info" className="hover:text-white">特定技能ガイド</Link><Link href="/tokutei2" className="hover:text-white">特定技能2号情報</Link><Link href="/mypage" className="hover:text-white">マイページ</Link></div></div>
        <div><h2 className="mb-2 font-bold text-white">特定技能の求人</h2><div className="flex flex-col gap-1"><Link href="/" className="hover:text-white">製造業の求人</Link><Link href="/" className="hover:text-white">建設業の求人</Link><Link href="/" className="hover:text-white">介護・外食・農業 ほか</Link></div></div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 px-6 pt-5 text-xs text-white/50">© 2026 {COMPANY.name} — 特定技能・育成就労の外国人材求人サイト</div>
    </footer>
  );
}
