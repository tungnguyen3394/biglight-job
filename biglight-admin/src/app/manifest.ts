import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESC } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — 特定技能の求人`,
    short_name: SITE_NAME,
    description: SITE_DESC,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#D02E26",
    lang: "ja",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
  };
}
