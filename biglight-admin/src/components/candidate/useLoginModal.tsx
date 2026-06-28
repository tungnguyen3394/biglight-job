"use client";

import { useState } from "react";
import LoginModal from "./LoginModal";

// Hook cho nút「30秒で無料登録」: mở modal đăng ký ngay (không chặn duyệt web).
// Đồng ý Privacy Policy được thu thập bằng checkbox trong modal đăng nhập.
export function useLoginModal(defaultRedirect = "/mypage") {
  const [open, setOpen] = useState(false);
  const [redirect, setRedirect] = useState(defaultRedirect);

  function onRegister(arg?: unknown) {
    const dest = typeof arg === "string" && arg.startsWith("/") ? arg : defaultRedirect;
    setRedirect(dest);
    setOpen(true);
  }

  const modal = <LoginModal open={open} onClose={() => setOpen(false)} redirect={redirect} />;
  return { onRegister, modal };
}
