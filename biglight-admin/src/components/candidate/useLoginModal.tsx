"use client";

import { useState } from "react";
import LoginModal from "./LoginModal";

// Hook cho nút「30秒で無料登録」: mở modal đăng ký ngay (không chặn duyệt web).
// Đồng ý Privacy Policy được thu thập bằng checkbox trong modal đăng nhập.
export function useLoginModal(defaultRedirect = "/mypage") {
  const [open, setOpen] = useState(false);
  const [redirect, setRedirect] = useState(defaultRedirect);
  const [title, setTitle] = useState<string | undefined>();
  const [desc, setDesc] = useState<string | undefined>();

  // arg: string (redirect) | { redirect?, title?, desc? } | event (bỏ qua) — tương thích ngược.
  function onRegister(arg?: unknown) {
    let dest = defaultRedirect;
    let t: string | undefined;
    let d: string | undefined;
    if (typeof arg === "string" && arg.startsWith("/")) {
      dest = arg;
    } else if (arg && typeof arg === "object" && "redirect" in arg) {
      const o = arg as { redirect?: string; title?: string; desc?: string };
      if (o.redirect?.startsWith("/")) dest = o.redirect;
      t = o.title;
      d = o.desc;
    }
    setRedirect(dest);
    setTitle(t);
    setDesc(d);
    setOpen(true);
  }

  const modal = <LoginModal open={open} onClose={() => setOpen(false)} redirect={redirect} title={title} desc={desc} />;
  return { onRegister, modal };
}
