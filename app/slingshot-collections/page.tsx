
import { getCollectionsByBrand, getCollectionBySlug } from "@/services/collections";
import { BrandCollectionsClient } from "@/components/collections/BrandCollectionsClient";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import { buildCanonicalUrl } from "@/lib/seo/url-server";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const canonicalPath = '/slingshot-collections';
    const canonicalUrl = await buildCanonicalUrl(canonicalPath);
    const hreflangLinks = buildHreflangLinks(canonicalUrl.replace(/\/.+$/, ""), canonicalPath);

    return {
        title: 'Slingshot Collections | Slingshot Sports',
        description: 'Discover all Slingshot high-performance gear collections.',
        alternates: {
            canonical: hreflangLinks.canonical,
            languages: hreflangLinks.alternates.languages,
        },
    };
}

export default async function SlingshotCollectionsPage() {
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value || "en";

    // Fetch collections for 'slingshot' brand
    const collections = await getCollectionsByBrand('slingshot', lang);

    // Fetch the hero configuration from the homepage collection named 'slingshot-collections'
    const heroCollection = await getCollectionBySlug('slingshot-collections', lang);

    const heroData = {
        title: heroCollection?.title || "SLINGSHOT COLLECTIONS",
        subtitle: heroCollection?.subtitle || "Discover all Slingshot high-performance gear collections.",
        imageUrl: heroCollection?.image_url || null,
        videoUrl: heroCollection?.video_url || null
    };

    const breadcrumbs = [
        { label: 'Home', href: '/' },
        { label: 'Slingshot', href: '#' },
        { label: 'Collections' }
    ];

    return (
        <BrandCollectionsClient
            collections={collections}
            heroData={heroData}
            breadcrumbs={breadcrumbs}
            brandColor="#000000"
        />
    );
}
