"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SaveButton({ jobId, initialSaved, loggedIn }: { jobId: string; initialSaved: boolean; loggedIn: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  function toggle() {
    if (!loggedIn) { router.push("/mypage"); return; }
    setSaved((s) => !s);
    fetch("/api/candidate/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
  }
  return (
    <button onClick={toggle} className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold shadow hover:bg-white" aria-label="お気に入り">
      <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "#D02E26" : "none"} stroke={saved ? "#D02E26" : "#5B6472"} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.5 1-1a5.5 5.5 0 0 0 0-7.7z" /></svg>
      <span className={saved ? "text-bl-red" : "text-bl-gray"}>{saved ? "保存済み" : "お気に入り"}</span>
    </button>
  );
}
