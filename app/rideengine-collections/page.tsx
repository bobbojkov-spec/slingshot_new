
import { getCollectionsByBrand, getCollectionBySlug } from "@/services/collections";
import { BrandCollectionsClient } from "@/components/collections/BrandCollectionsClient";
import { cookies } from "next/headers";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

import { buildCanonicalUrl, resolveBaseUrl } from "@/lib/seo/url-server";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import { generateListingSEO } from "@/lib/seo/generate-listing-seo";

export async function generateMetadata(): Promise<Metadata> {
    const canonicalPath = '/rideengine-collections';
    const baseUrl = await resolveBaseUrl();
    const hreflangLinks = buildHreflangLinks(baseUrl, canonicalPath);

    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value || "en";

    const title = lang === "bg"
        ? 'Колекции Ride Engine | Slingshot България'
        : 'Ride Engine Collections | Slingshot Sports';
    const description = lang === "bg"
        ? 'Разгледайте пълната гама Ride Engine колекции. Трапези, неопрен и пътна екипировка.'
        : 'Explore our complete range of Ride Engine gear collections. Harnesses, wetsuits, and travel gear.';

    const seo = generateListingSEO({
        language: lang === "bg" ? "bg" : "en",
        heroTitle: title,
        heroSubtitle: description,
        collectionNames: ['Ride Engine'],
        brand: 'Ride Engine',
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

export default async function RideEngineCollectionsPage() {
    const cookieStore = await cookies();

    const lang = cookieStore.get("lang")?.value || "en";

    // Fetch collections for 'rideengine' brand
    const collections = await getCollectionsByBrand('rideengine', lang);

    // Fetch the hero configuration from the homepage collection named 'rideengine-collections'
    // This allows admins to edit the Title/Subtitle and Video/Image in the admin panel
    const heroCollection = await getCollectionBySlug('rideengine-collections', lang);

    const heroData = {
        title: heroCollection?.title || "RIDE ENGINE COLLECTIONS",
        subtitle: heroCollection?.subtitle || "Explore our complete range of Ride Engine gear.",
        imageUrl: heroCollection?.image_url || null,
        videoUrl: heroCollection?.video_url || null
    };

    const breadcrumbs = [
        { label: 'Home', href: '/' },
        { label: 'Ride Engine', href: '#' }, // Using hash or simplified breadcrumb
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
