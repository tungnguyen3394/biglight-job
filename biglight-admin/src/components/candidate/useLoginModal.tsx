"use client";

import { useState } from "react";
import LoginModal from "./LoginModal";
import { hasCookieConsent, requestCookieConsent, CONSENT_GRANTED_EVENT } from "@/lib/cookieConsent";

// Hook dùng chung cho nút「30秒で無料登録」: gate cookie consent → mở modal đăng ký.
// onRegister(dest?) — truyền đường dẫn để sau khi đăng ký xong quay lại đúng chỗ (vd mở form ứng tuyển).
export function useLoginModal(defaultRedirect = "/mypage") {
  const [open, setOpen] = useState(false);
  const [redirect, setRedirect] = useState(defaultRedirect);

  function onRegister(arg?: unknown) {
    if (typeof window === "undefined") return;
    const dest = typeof arg === "string" && arg.startsWith("/") ? arg : defaultRedirect;
    setRedirect(dest);
    if (!hasCookieConsent()) {
      requestCookieConsent();
      const granted = () => { setOpen(true); window.removeEventListener(CONSENT_GRANTED_EVENT, granted); };
      window.addEventListener(CONSENT_GRANTED_EVENT, granted);
      return;
    }
    setOpen(true);
  }

  const modal = <LoginModal open={open} onClose={() => setOpen(false)} redirect={redirect} />;
  return { onRegister, modal };
}
