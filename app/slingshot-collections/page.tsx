
import { getCollectionsByBrand, getCollectionBySlug } from "@/services/collections";
import { BrandCollectionsClient } from "@/components/collections/BrandCollectionsClient";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import { buildCanonicalUrl, resolveBaseUrl } from "@/lib/seo/url-server";
import { generateListingSEO } from "@/lib/seo/generate-listing-seo";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const canonicalPath = '/slingshot-collections';
    const baseUrl = await resolveBaseUrl();
    const hreflangLinks = buildHreflangLinks(baseUrl, canonicalPath);

    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value || "en";

    const title = lang === "bg"
        ? 'Колекции Slingshot | Slingshot България'
        : 'Slingshot Collections | Slingshot Sports';
    const description = lang === "bg"
        ? 'Разгледайте всички високопроизводителни Slingshot колекции. Кайтове, дъски, фойлове и уейк.'
        : 'Discover all Slingshot high-performance gear collections. Kites, boards, foils, and wake.';

    const seo = generateListingSEO({
        language: lang === "bg" ? "bg" : "en",
        heroTitle: title,
        heroSubtitle: description,
        collectionNames: ['Slingshot'],
        brand: 'Slingshot',
        fallbackTitle: title,
        fallbackDescription: description,
    });

    return {
        title: seo.title,
        description: seo.description,
        openGraph: {
            title: seo.ogTitle,
            description: seo.ogDescription,
            url: hreflangLinks.canonical,
            type: 'website',
            images: [
                {
                    url: '/images/og-default.jpg',
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: seo.ogTitle,
            description: seo.ogDescription,
            images: ['/images/og-default.jpg'],
        },
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
