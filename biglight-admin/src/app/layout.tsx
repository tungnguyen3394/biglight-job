import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import CookiePolicyConsent from "@/components/CookiePolicyConsent";

export const metadata: Metadata = {
  title: "BIGLIGHT Job — Admin",
  description: "特定技能 / 育成就労 / 外国人材 recruiting admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Inter:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <CookiePolicyConsent />
        {/* Google Translate — nạp 1 lần, các nút LangSwitch sẽ điều khiển combo này */}
        <div id="google_translate_element" />
        <Script id="gt-init" strategy="afterInteractive">{`
          function googleTranslateElementInit(){
            new google.translate.TranslateElement({pageLanguage:'ja',includedLanguages:'ja,vi,en,zh-CN,id,my,ne,th',autoDisplay:false},'google_translate_element');
          }
        `}</Script>
        <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      </body>
    </html>
  );
}
