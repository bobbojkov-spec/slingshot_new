
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/services/collections";
import { CollectionShopClient } from "@/components/collections/CollectionShopClient";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { buildBreadcrumbSchema } from "@/lib/seo/business";
import { buildHreflangLinks } from "@/lib/seo/hreflang";
import { buildCanonicalUrl } from "@/lib/seo/url-server";
import type { Metadata } from "next";

interface PageProps {
    params: Promise<{ slug: string }>;
}

import { cookies } from "next/headers";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value || "en";
    const collection = await getCollectionBySlug(slug, lang);

    const canonicalPath = `/collections/${slug}`;
    const canonicalUrl = await buildCanonicalUrl(canonicalPath);
    const hreflangLinks = buildHreflangLinks(canonicalUrl.replace(/\/.+$/, ""), canonicalPath);

    if (!collection) {
        return {
            title: 'Collection Not Found | Slingshot Sports',
            alternates: {
                canonical: hreflangLinks.canonical,
                languages: hreflangLinks.alternates.languages,
            },
        };
    }

    const title = `${collection.title} | Slingshot Sports`;
    const description = collection.description?.slice(0, 160) || `Discover our ${collection.title} collection at Slingshot Sports. High-performance gear for your next adventure.`;
    const images = collection.image_url ? [{ url: collection.image_url, width: 1200, height: 630, alt: collection.title }] : [];

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            images,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
        alternates: {
            canonical: hreflangLinks.canonical,
            languages: hreflangLinks.alternates.languages,
        },
    };
}

export default async function CollectionPage({ params }: PageProps) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value || "en";
    const collection = await getCollectionBySlug(slug, lang);

    if (!collection) {
        notFound();
    }

    const breadcrumbs = [
        { label: 'Shop', href: '/shop' },
        ...(collection.source === 'rideengine' ? [{ label: 'RIDEENGINE', href: '/rideengine' }] : [{ label: 'SLINGSHOT', href: '/slingshot' }]),
        { label: collection.title }
    ];

    const breadcrumbSchema = buildBreadcrumbSchema(
        process.env.NEXT_PUBLIC_SITE_URL || "",
        breadcrumbs
    );

    const canonicalPath = `/collections/${slug}`;
    const canonicalUrl = await buildCanonicalUrl(canonicalPath);

    const pageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: collection.title,
        description: collection.description || undefined,
        url: canonicalUrl,
        image: collection.image_url || undefined,
    };

    return (
        <>
            {process.env.NEXT_PUBLIC_SITE_URL && (
                <>
                    <SchemaJsonLd data={breadcrumbSchema} />
                    <SchemaJsonLd data={pageSchema} />
                </>
            )}
            <CollectionShopClient
                initialCollection={collection}
                slug={slug}
                breadcrumbs={breadcrumbs}
            />
        </>
    );
}
