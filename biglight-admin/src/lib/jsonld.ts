import { PUBLIC_BASE_URL, FB_PAGE_URL, COMPANY, CONTACT_EMAIL } from "./site";
import { SITE_NAME } from "./seo";

const u = (p = "/") => new URL(p, PUBLIC_BASE_URL).toString();

// Organization (運営会社) — dùng toàn site.
export function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    alternateName: SITE_NAME,
    url: PUBLIC_BASE_URL,
    logo: u("/logo.png"),
    email: CONTACT_EMAIL,
    telephone: COMPANY.tel,
    address: { "@type": "PostalAddress", postalCode: COMPANY.postal.replace("〒", ""), addressCountry: "JP", streetAddress: COMPANY.address },
    sameAs: [FB_PAGE_URL, "https://biglight.jp/"],
  };
}

// WebSite + ô tìm kiếm (Sitelinks Searchbox).
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: PUBLIC_BASE_URL,
    inLanguage: "ja",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: u("/jobs?q={query}") },
      "query-input": "required name=query",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: u(it.path) })),
  };
}

export function articleJsonLd(a: { title: string; description?: string; image?: string; path: string; published?: string; modified?: string; author?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description || undefined,
    image: a.image || u("/api/og"),
    url: u(a.path),
    mainEntityOfPage: u(a.path),
    datePublished: a.published,
    dateModified: a.modified || a.published,
    author: { "@type": "Organization", name: a.author || COMPANY.name },
    publisher: { "@type": "Organization", name: COMPANY.name, logo: { "@type": "ImageObject", url: u("/logo.png") } },
  };
}

// JobPosting — thẻ tuyển dụng cho Google Rich Results.
export function jobPostingJsonLd(j: {
  title: string; description: string; path: string; datePosted: string; validThrough?: string;
  region: string; city?: string | null; payType?: string | null; baseSalary?: number | null;
  salaryMin?: number | null; salaryMax?: number | null; image?: string | null; employmentType?: string | null;
}) {
  const unit = j.payType === "時給" ? "HOUR" : j.payType === "日給" ? "DAY" : "MONTH";
  const salary = j.baseSalary ?? j.salaryMin ?? undefined;
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: j.title,
    description: j.description,
    datePosted: j.datePosted,
    validThrough: j.validThrough,
    employmentType: "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: COMPANY.name, sameAs: PUBLIC_BASE_URL, logo: u("/logo.png") },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: j.region, addressLocality: j.city || undefined, addressCountry: "JP" } },
    image: j.image || u("/api/og"),
    url: u(j.path),
    ...(salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "JPY",
            value: { "@type": "QuantitativeValue", ...(j.salaryMin && j.salaryMax ? { minValue: j.salaryMin, maxValue: j.salaryMax } : { value: salary }), unitText: unit },
          },
        }
      : {}),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  };
}
