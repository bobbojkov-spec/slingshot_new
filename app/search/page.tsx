import type { Metadata } from "next";
import SearchClient from "@/app/search/SearchClient";
import { buildCanonicalUrl, resolveBaseUrl } from "@/lib/seo/url-server";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import { cookies } from "next/headers";
import { generateListingSEO } from "@/lib/seo/generate-listing-seo";

type SearchParams = {
    q?: string;
    tag?: string | string[];
    lang?: string;
};

const buildSearchParams = (params?: SearchParams) => {
    if (!params) return "";
    const entries = Object.entries(params).flatMap(([key, value]) => {
        if (value === undefined) return [];
        if (Array.isArray(value)) return value.map((item) => [key, item]);
        return [[key, value]];
    });
    return new URLSearchParams(entries as Array<[string, string]>).toString();
};

const normalizeTagLabel = (tag?: string | string[]) => {
    if (!tag) return "";
    if (Array.isArray(tag)) return tag.join(", ");
    return tag;
};

export async function generateMetadata({
    searchParams,
}: {
    searchParams?: SearchParams;
}): Promise<Metadata> {
    const query = searchParams?.q ?? "";
    const tag = normalizeTagLabel(searchParams?.tag);

    const cookieStore = await cookies();
    const lang = searchParams?.lang || cookieStore.get("lang")?.value || "en";

    // Original canonicalQuery and canonicalPath logic is replaced
    const canonicalPath = `/search?q=${encodeURIComponent(query)}`;
    const baseUrl = await resolveBaseUrl();
    const hreflangLinks = buildHreflangLinks(baseUrl, canonicalPath);

    // New title and description logic with localization
    const title = lang === "bg"
        ? `Резултати за "${query}" | Slingshot България`
        : `Search Results for "${query}" | Slingshot Bulgaria`;
    const description = lang === 'bg'
        ? `Резултати от търсенето за "${query}" в Slingshot Bulgaria.`
        : `Search results for "${query}" at Slingshot Bulgaria.`;

    const seo = generateListingSEO({
        language: lang === "bg" ? "bg" : "en",
        heroTitle: title,
        heroSubtitle: description,
        tags: tag ? [tag] : [],
        fallbackTitle: title,
        fallbackDescription: description,
    });

    return {
        title: seo.title,
        description: seo.description,
        robots: {
            index: false, // Keep robots index: false as per original
            follow: true,
        },
        openGraph: {
            title: seo.ogTitle,
            description: seo.ogDescription,
            url: hreflangLinks.canonical, // Use canonical from hreflangLinks
            siteName: "Slingshot Bulgaria", // Added siteName
            type: "website",
            images: [ // Added images
                {
                    url: "/images/og-default.jpg",
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: seo.ogTitle,
            description: seo.ogDescription,
            images: ["/images/og-default.jpg"], // Added images
        },
        alternates: {
            canonical: hreflangLinks.canonical,
            languages: hreflangLinks.alternates.languages,
        },
    };
}

export default function SearchPage() {
    return <SearchClient />;
}