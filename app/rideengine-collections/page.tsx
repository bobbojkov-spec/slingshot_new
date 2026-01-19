
import { getCollectionsByBrand, getCollectionBySlug } from "@/services/collections";
import { BrandCollectionsClient } from "@/components/collections/BrandCollectionsClient";
import { cookies } from "next/headers";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Ride Engine Collections | Slingshot Sports',
    description: 'Explore our complete range of Ride Engine gear collections.',
};

export default async function RideEngineCollectionsPage() {
    const cookieStore = await cookies();

    const lang = cookieStore.get("lang")?.value || "en";

    // Fetch collections for 'rideengine' brand
    const collections = await getCollectionsByBrand('rideengine', lang);

    // Fetch the hero configuration from the homepage collection named 'rideengine-collections'
    // This allows admins to edit the Title/Subtitle and Video/Image in the admin panel
    const heroCollection = await getCollectionBySlug('rideengine-collections', lang);
    console.log('DEBUG: slugs/rideengine-collections', heroCollection);

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
