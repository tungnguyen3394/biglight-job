"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/candidate/Shell";
import { FB_PAGE_URL } from "@/lib/site";

function fbRegister() {
  window.open(FB_PAGE_URL, "_blank", "noopener");
}

function MyPageInner() {
  const params = useSearchParams();
  const applyCode = params.get("apply");
  const applyTitle = params.get("t");

  return (
    <Shell active="mypage">
      <div className="mx-auto max-w-md px-4 py-6">
        {applyCode && (
          <div className="mb-5 rounded-2xl border border-bl-green bg-bl-greensoft p-4 text-sm font-semibold text-bl-green">
            ✓ 「{applyTitle ?? applyCode}」に応募するには、まず無料登録してください。
          </div>
        )}

        <div className="rounded-3xl border border-bl-line bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bl-red text-2xl font-black text-white">B</div>
          <h1 className="text-xl font-black">無料登録して、マイページを使おう</h1>
          <p className="mt-2 text-sm text-bl-gray">応募状況の確認・担当者との連絡・あなたに合う求人のご紹介。すべて無料です。</p>

          <button onClick={fbRegister} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-bl-fb py-3.5 font-bold text-white hover:bg-[#0C63D4]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
            Facebookで無料登録
          </button>

          <ul className="mt-6 space-y-2 text-left text-sm text-bl-gray">
            <li>✓ 応募の進捗をいつでも確認</li>
            <li>✓ 担当者とFacebookで直接やりとり</li>
            <li>✓ プロフィールを入れるほど良い求人が届く</li>
          </ul>
        </div>

        <p className="mt-4 text-center text-xs text-bl-gray2">※ プロフィール入力・応募状況の詳細画面は近日公開予定です。</p>
      </div>
    </Shell>
  );
}

export default function MyPage() {
  return (
    <Suspense fallback={null}>
      <MyPageInner />
    </Suspense>
  );
}
