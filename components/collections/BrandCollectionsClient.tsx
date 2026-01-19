'use client';

import { CollectionHero } from './CollectionHero';
import { FloatingWarning } from '@/components/FloatingWarning';
import { Collection } from '@/services/collections';
import Link from 'next/link';
import { Layers } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BrandCollectionsClientProps {
    collections: Collection[];
    heroData: {
        title: string;
        subtitle?: string;
        imageUrl?: string | null;
        videoUrl?: string | null;
    };
    breadcrumbs?: BreadcrumbItem[];
    brandColor?: string; // Optional accent color
}

export function BrandCollectionsClient({ collections, heroData, breadcrumbs, brandColor }: BrandCollectionsClientProps) {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <CollectionHero
                title={heroData.title}
                subtitle={heroData.subtitle}
                imageUrl={heroData.imageUrl || null}
                videoUrl={heroData.videoUrl || null}
                breadcrumbs={breadcrumbs}
            />

            {/* Collections Grid */}
            <div className="container mx-auto px-4 py-12">
                {collections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {collections.map((collection) => (
                            <Link
                                key={collection.id}
                                href={`/collections/${collection.slug}`}
                                className="group relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                            >
                                {collection.image_url ? (
                                    <img
                                        src={collection.image_url}
                                        alt={collection.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                        <Layers className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                    <h3
                                        className="text-2xl font-black text-white uppercase tracking-tighter mb-2 transition-colors"
                                    >
                                        {collection.title}
                                    </h3>
                                    {collection.subtitle && (
                                        <p className="text-sm text-gray-300 line-clamp-2 max-w-[80%] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                            {collection.subtitle}
                                        </p>
                                    )}
                                    {collection.products && (
                                        <p className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">
                                            {/* We might not check actual count here if we optimized the query to not return products array, 
                                                but getCollectionsByBrand returns separate 'product_count' if we query it, 
                                                or assumes filtered > 0. 
                                                Actually getCollectionsByBrand returns products: [] but we fetch collection count. 
                                                Let's check if we have product_count in the type or just hide it.
                                                The Type definition in services/collections.ts doesn't have product_count, 
                                                so we likely won't display it unless we update the type. 
                                                For now we skip displaying count to avoid type errors. 
                                            */}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-xl">No collections found.</p>
                    </div>
                )}
            </div>

            <FloatingWarning />
        </div>
    );
}
