import type { Metadata } from "next";
import SearchClient from "@/app/search/SearchClient";
import { buildCanonicalUrl } from "@/lib/seo/url-server";

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

    const pageTitle = query
        ? `Search "${query}" | Slingshot Bulgaria`
        : tag
            ? `Tag: ${tag} | Slingshot Bulgaria`
            : "Search | Slingshot Bulgaria";

    const searchLabel = query
        ? `Search for "${query}".`
        : tag
            ? `Tag: ${tag}.`
            : "Search results.";

    const canonicalQuery = buildSearchParams(searchParams);
    const canonicalUrl = await buildCanonicalUrl(`/search${canonicalQuery ? `?${canonicalQuery}` : ""}`);

    return {
        title: pageTitle,
        description: searchLabel,
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: false,
            follow: true,
        },
        openGraph: {
            title: pageTitle,
            description: searchLabel,
            url: canonicalUrl,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: pageTitle,
            description: searchLabel,
        },
    };
}

export default function SearchPage() {
    return <SearchClient />;
}