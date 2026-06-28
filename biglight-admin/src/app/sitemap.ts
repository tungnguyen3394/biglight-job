import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLIC_BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => `${PUBLIC_BASE_URL}${p}`;

  const statics: MetadataRoute.Sitemap = [
    { url: u("/"), changeFrequency: "daily", priority: 1 },
    { url: u("/jobs"), changeFrequency: "daily", priority: 0.9 },
    { url: u("/guide"), changeFrequency: "weekly", priority: 0.7 },
    { url: u("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: u("/tokutei2"), changeFrequency: "monthly", priority: 0.5 },
    { url: u("/info"), changeFrequency: "monthly", priority: 0.4 },
    { url: u("/privacy-policy"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const [jobs, articles] = await Promise.all([
    prisma.job.findMany({ where: { publicStatus: "PUBLIC" }, select: { id: true, updatedAt: true } }).catch(() => []),
    prisma.article.findMany({ where: { status: "PUBLISHED" }, select: { id: true, slug: true, updatedAt: true } }).catch(() => []),
  ]);

  const jobUrls: MetadataRoute.Sitemap = jobs.map((j) => ({ url: u(`/jobs/${j.id}`), lastModified: j.updatedAt, changeFrequency: "weekly", priority: 0.8 }));
  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({ url: u(`/guide/${a.slug || a.id}`), lastModified: a.updatedAt, changeFrequency: "monthly", priority: 0.6 }));

  return [...statics, ...jobUrls, ...articleUrls];
}
