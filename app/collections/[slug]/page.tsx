
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
    const canonicalPath = `/collections/${slug}`;
    const canonicalUrl = await buildCanonicalUrl(canonicalPath);
    const hreflangLinks = buildHreflangLinks(canonicalUrl.replace(/\/.+$/, ""), canonicalPath);

    return {
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

    return (
        <>
            {process.env.NEXT_PUBLIC_SITE_URL && (
                <SchemaJsonLd data={breadcrumbSchema} />
            )}
            <CollectionShopClient
                initialCollection={collection}
                slug={slug}
                breadcrumbs={breadcrumbs}
            />
        </>
    );
}
