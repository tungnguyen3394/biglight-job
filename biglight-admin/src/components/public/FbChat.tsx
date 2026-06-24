"use client";

import { useState } from "react";
import { FB_MESSENGER_URL } from "@/lib/site";

const FbIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
  </svg>
);

type Msg = { who: "bot" | "me"; text: string };

// Cửa sổ chat nổi góc dưới phải. Trả lời demo + nút "Messengerで続ける" mở chat Facebook thật.
export default function FbChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "bot", text: "こんにちは。BIGLIGHT JOBです。特定技能のお仕事をお探しですか？" },
    { who: "bot", text: "ご希望の分野・地域を教えてください。日本語・ベトナム語どちらでもOKです。" },
  ]);

  function send() {
    const v = input.trim();
    if (!v) return;
    setMsgs((m) => [...m, { who: "me", text: v }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { who: "bot", text: "メッセージありがとうございます。より詳しくは下のMessengerでお話ししましょう。" },
      ]);
    }, 650);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {/* Chat window */}
      <div
        className={`w-[340px] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        } origin-bottom-right`}
      >
        <div className="flex items-center gap-3 bg-gradient-to-br from-[#00B2FF] to-[#006AFF] p-4 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-black">B</div>
          <div className="leading-tight">
            <b className="text-sm">BIGLIGHT サポート</b>
            <p className="text-[11px] opacity-90">オンライン・通常すぐ返信</p>
          </div>
          <button className="ml-auto text-xl leading-none" onClick={() => setOpen(false)} aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="flex h-[220px] flex-col gap-2 overflow-y-auto bg-[#F0F2F5] p-4">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed ${
                m.who === "bot"
                  ? "self-start rounded-bl-sm bg-white text-ink"
                  : "self-end rounded-br-sm bg-[#006AFF] text-white"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="border-t border-bl-line bg-white p-3">
          <div className="mb-2 flex gap-2 rounded-full bg-[#F0F2F5] py-1 pl-4 pr-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="メッセージを入力…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button
              onClick={send}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006AFF] text-white"
              aria-label="送信"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
              </svg>
            </button>
          </div>
          <a
            href={FB_MESSENGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-bl-fb py-2.5 text-sm font-bold text-white"
          >
            <FbIcon size={15} />
            Messengerで続ける
          </a>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] shadow-lg transition hover:scale-105"
        title="チャットで相談"
        aria-label="チャットで相談"
      >
        <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full border-2 border-white bg-bl-red" />
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden>
          <path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.25 1.9.39 2.9.39 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.4l-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7z" />
        </svg>
      </button>
    </div>
  );
}
