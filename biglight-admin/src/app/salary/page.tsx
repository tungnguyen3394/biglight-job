import Link from "next/link";
import Shell from "@/components/candidate/Shell";
import FbChat from "@/components/candidate/FbChat";
import SalaryCalc from "@/components/candidate/SalaryCalc";

export const metadata = { title: "手取り計算ツール｜BIGLIGHT JOB" };

export default function SalaryPage() {
  return (
    <Shell active="mypage">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/mypage" className="text-sm font-semibold text-bl-gray hover:text-ink">← マイページへ戻る</Link>
      </div>
      <SalaryCalc />
      <FbChat />
    </Shell>
  );
}
