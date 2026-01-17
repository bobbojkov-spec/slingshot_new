
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { getCollectionByHandle } from "@/services/collections";
import { CollectionHero } from "@/components/collections/CollectionHero";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
    const { slug } = await params;
    const collection = await getCollectionByHandle(slug);

    if (!collection) {
        notFound();
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <CollectionHero
                title={collection.title}
                subtitle={collection.subtitle}
                imageUrl={collection.image_url}
                videoUrl={collection.video_url}
            />

            {/* Products Grid */}
            <div className="bg-white py-12">
                <div className="container mx-auto px-4">
                    <ProductGrid products={collection.products} />
                </div>
            </div>
        </div>
    );
}
