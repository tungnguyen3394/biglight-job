import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import CookiePolicyConsent from "@/components/CookiePolicyConsent";
import { JsonLd } from "@/components/common/JsonLd";
import { orgJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { SITE_NAME, SITE_DESC, SITE_LOCALE, DEFAULT_OG } from "@/lib/seo";
import { PUBLIC_BASE_URL } from "@/lib/site";

const HOME_TITLE = "特定技能の求人を探す｜寮あり・ビザ支援｜BIGLIGHT JOB";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_BASE_URL),
  title: { default: HOME_TITLE, template: "%s" },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  themeColor: "#D02E26",
  icons: { icon: "/logo.png", shortcut: "/logo.png", apple: "/logo.png" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { type: "website", siteName: SITE_NAME, locale: SITE_LOCALE, url: PUBLIC_BASE_URL, title: HOME_TITLE, description: SITE_DESC, images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: SITE_NAME }] },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESC, images: [DEFAULT_OG] },
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
        <JsonLd data={[orgJsonLd(), websiteJsonLd()]} />
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
