'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { CollectionHero } from './CollectionHero';
import { FloatingWarning } from '@/components/FloatingWarning';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Collection } from '@/services/collections';
import Link from 'next/link';

import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface CollectionShopClientProps {
    initialCollection: Collection;
    slug: string;
    breadcrumbs?: BreadcrumbItem[];
}

export function CollectionShopClient({ initialCollection, slug, breadcrumbs }: CollectionShopClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { language } = useLanguage();

    const [products, setProducts] = useState(initialCollection.products || []);
    const [facets, setFacets] = useState({ categories: [], collections: [], types: [], tags: [], brands: [] });
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: initialCollection.products?.length || 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial hydration ref to prevent double fetch on mount if language matches
    // But since we can switch language client-side, we should listen to it.

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams(searchParams.toString());

                // FORCE collection slug
                params.set('collection', slug);
                params.set('limit', '12'); // Match API default or desired grid size
                params.set('lang', language); // Pass language

                const res = await fetch(`/api/products?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch products');

                const data = await res.json();
                setProducts(data.products);
                setFacets(data.facets || { categories: [], collections: [], types: [], tags: [], brands: [] });
                setPagination(data.pagination);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        // If we have filters, or if we want to ensure pagination/facets are loaded (initialCollection might miss facets?)
        // initialCollection doesn't have facets in `getCollectionBySlug` result.
        // So we ALWAYS need to fetch at least once to get Facets?
        // Or we can load facets separately?
        // Simpler: Just fetch everything client-side. Server data serves as "Hero" data mainly.
        // OR: We display initial products while fetching?

        fetchProducts();

    }, [searchParams, slug, language]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/collections/${slug}?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Static from server data */}
            <CollectionHero
                title={initialCollection.title}
                subtitle={initialCollection.subtitle}
                imageUrl={initialCollection.image_url}
                videoUrl={initialCollection.video_url}
                breadcrumbs={breadcrumbs}
            />

            {/* Child Collections Grid (Meta-collection feature) */}
            {initialCollection.child_collections && initialCollection.child_collections.length > 0 && (
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {initialCollection.child_collections.map((child: any) => (
                            <Link
                                key={child.id}
                                href={`/collections/${child.slug}`}
                                className="group relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                            >
                                {child.image_url ? (
                                    <img
                                        src={child.image_url}
                                        alt={child.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                        <Layers className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-accent transition-colors">
                                        {child.title}
                                    </h3>
                                    {child.subtitle && (
                                        <p className="text-sm text-gray-300 line-clamp-2 max-w-[80%] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                            {child.subtitle}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Toolbar - only if there are products or we are loading */}
            {(products.length > 0 || (loading && !initialCollection.child_collections?.length)) && (
                <ShopToolbar
                    facets={{ ...facets, collections: [] }}
                    totalProducts={pagination.total}
                    basePath={`/collections/${slug}`}
                />
            )}

            <div className="container mx-auto px-4 py-8">

                {error ? (
                    <div className="text-center py-20 text-red-500">Error: {error}</div>
                ) : loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                    </div>
                ) : products.length === 0 ? (
                    !initialCollection.child_collections?.length && (
                        <div className="text-center py-20 text-gray-500">No products found matching your criteria.</div>
                    )
                ) : (
                    <>
                        <ProductGrid products={products} />

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center mt-12 space-x-4">
                                <Button
                                    variant="outline"
                                    disabled={pagination.page === 1}
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                                </Button>
                                <span className="text-sm font-medium">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
            <FloatingWarning />
        </div>
    );
}
