import type { MetadataRoute } from "next";
import { PUBLIC_BASE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/mypage", "/login"] },
    ],
    sitemap: `${PUBLIC_BASE_URL}/sitemap.xml`,
    host: PUBLIC_BASE_URL,
  };
}
