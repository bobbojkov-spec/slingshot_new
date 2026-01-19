
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/services/collections";
import { CollectionShopClient } from "@/components/collections/CollectionShopClient";

interface PageProps {
    params: Promise<{ slug: string }>;
}

import { cookies } from "next/headers";

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

    return (
        <CollectionShopClient
            initialCollection={collection}
            slug={slug}
            breadcrumbs={breadcrumbs}
        />
    );
}
