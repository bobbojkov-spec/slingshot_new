import type { Metadata } from "next";
import SearchClient from "@/app/search/SearchClient";
import { buildMetadataFromSeo, resolvePageSEO } from "@/lib/seo/metadata";

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
    const seo = await resolvePageSEO({ type: "search", searchParams, path: "/search" });
    return buildMetadataFromSeo(seo);
}

export default function SearchPage() {
    return <SearchClient />;
}