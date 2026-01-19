
import { getCollectionsByBrand } from "@/services/collections";
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

    const heroData = {
        title: "RIDE ENGINE COLLECTIONS",
        subtitle: "Explore our complete range of Ride Engine gear.",
        imageUrl: null // No specific hero image for this aggregated page yet
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
