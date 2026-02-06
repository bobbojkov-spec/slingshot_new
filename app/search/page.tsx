'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Head from "next/head";
import { ProductGrid } from '@/components/products/ProductGrid';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ShopHero } from '@/components/shop/ShopHero';
import { FloatingWarning } from '@/components/FloatingWarning';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SchemaJsonLd from '@/components/seo/SchemaJsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/business';
import { buildCanonicalUrlClient } from '@/lib/seo/url';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const tag = searchParams.getAll('tag').join(', ');

    const [products, setProducts] = useState([]);
    const [facets, setFacets] = useState({ categories: [], collections: [], types: [], tags: [], brands: [] });
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams(searchParams.toString());
                // Force limit if needed, or keep default
                const res = await fetch(`/api/products?${params.toString()}&limit=12`);
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

        fetchProducts();
    }, [searchParams]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/search?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const searchLabel = query
        ? `Search for "${query}": ${pagination.total} results`
        : tag
            ? `Tag: ${tag} (${pagination.total} results)`
            : `${pagination.total} results`;

    const breadcrumbItems = [
        { label: 'Shop', href: '/shop' },
        { label: searchLabel },
    ];

    const canonicalUrl = buildCanonicalUrlClient(`/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    const baseUrl = canonicalUrl.replace(/\/.+$/, "");
    const breadcrumbSchema = buildBreadcrumbSchema(baseUrl, breadcrumbItems);
    const pageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Search",
        url: canonicalUrl,
        description: searchLabel,
    };

    const pageTitle = query
        ? `Search "${query}" | Slingshot Bulgaria`
        : tag
            ? `Tag: ${tag} | Slingshot Bulgaria`
            : "Search | Slingshot Bulgaria";
    const pageDescription = searchLabel;
    const baseOgImage = `${canonicalUrl.replace(/\/.+$/, "")}/images/og-default.jpg`;

    return (
        <div className="min-h-screen product-listing-bg pt-20">
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:site_name" content="Slingshot Bulgaria" />
                <meta property="og:type" content="website" />
                <meta property="og:image" content={baseOgImage} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content={baseOgImage} />
                <link rel="canonical" href={canonicalUrl} />
            </Head>
            <SchemaJsonLd data={breadcrumbSchema} defer />
            <SchemaJsonLd data={pageSchema} defer />
            <ShopHero
                title="Search"
                breadcrumbs={breadcrumbItems}
                variant="minimal"
            />

            <ShopToolbar facets={facets} totalProducts={pagination.total} />

            <div className="section-container py-8">

                {error ? (
                    <div className="text-center py-20 text-red-500">Error: {error}</div>
                ) : loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 space-y-4">
                        <p>
                            {query ? `No products found for "${query}".` : tag ? `No products found for tag "${tag}".` : 'No products found.'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                            <button
                                onClick={() => router.push('/search')}
                                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-900 transition"
                            >
                                Clear search
                            </button>
                            <button
                                onClick={() => router.push('/shop')}
                                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:border-gray-400 transition"
                            >
                                Browse all products
                            </button>
                        </div>
                    </div>
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

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchContent />
        </Suspense>
    );
}
