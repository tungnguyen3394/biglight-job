import type { Metadata } from "next";
import { PUBLIC_BASE_URL } from "./site";

export const SITE_NAME = "BIGLIGHT JOB";
export const SITE_LOCALE = "ja_JP";
export const SITE_DESC =
  "特定技能の求人を、地域・分野・条件でかんたん検索。寮あり・未経験OK・ビザサポートつき。外国人材のお仕事探しをBIGLIGHTが無料で応援します。";
export const DEFAULT_OG = `${PUBLIC_BASE_URL}/api/og`; // ảnh OG thương hiệu mặc định (1200×630)

const abs = (u?: string | null) => {
  if (!u) return DEFAULT_OG;
  if (u.startsWith("http")) return u;
  return new URL(u, PUBLIC_BASE_URL).toString();
};

type Opt = {
  title?: string;
  description?: string;
  path?: string; // "/jobs/abc"
  image?: string | null; // absolute hoặc tương đối; null → ảnh mặc định
  type?: "website" | "article";
  noIndex?: boolean;
  publishedTime?: string;
};

// Tạo Metadata đồng bộ (OpenGraph + Twitter + canonical + robots) cho mọi trang.
export function buildMetadata(o: Opt = {}): Metadata {
  const url = new URL(o.path ?? "/", PUBLIC_BASE_URL).toString();
  const title = o.title ?? SITE_NAME;
  const description = (o.description ?? SITE_DESC).slice(0, 200);
  const image = abs(o.image);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: o.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: {
      type: o.type ?? "website",
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(o.publishedTime ? { publishedTime: o.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
