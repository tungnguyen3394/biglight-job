"use client";

import { useState } from "react";
import LoginModal from "./LoginModal";
import { hasCookieConsent, requestCookieConsent, CONSENT_GRANTED_EVENT } from "@/lib/cookieConsent";

// Hook dùng chung cho nút「30秒で無料登録」: gate cookie consent → mở modal đăng nhập.
export function useLoginModal(redirect = "/mypage") {
  const [open, setOpen] = useState(false);

  function onRegister() {
    if (typeof window === "undefined") return;
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
