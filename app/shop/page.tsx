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
import ShopOverview from '@/components/shop/ShopOverview';
import ShopBrandOverview from '@/components/shop/ShopBrandOverview';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import SchemaJsonLd from '@/components/seo/SchemaJsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/business';
import { buildCanonicalUrlClient } from '@/lib/seo/url';



function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState({ categories: [], collections: [], types: [], tags: [], brands: [] });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>(process.env.NEXT_PUBLIC_SITE_URL || "");

  useEffect(() => {
    if (!origin && typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, [origin]);

  const normalizedBrand = (brand: string | null) => {
    if (!brand) return null;
    const lowered = brand.toLowerCase();
    if (lowered === 'rideengine') return 'ride-engine';
    return lowered;
  };

  // Get all brand values (for multi-select support)
  const brandParams = searchParams.getAll('brand').map(b => normalizedBrand(b)).filter(Boolean) as string[];
  // Single brand for display purposes
  const brandParam = brandParams.length === 1 ? brandParams[0] : null;
  // Both brands selected = effectively no brand filter (show all)
  const bothBrandsSelected = brandParams.length === 2 &&
    brandParams.includes('ride-engine') && brandParams.includes('slingshot');
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    const categoryLower = categoryParam?.toLowerCase();
    if (categoryLower === 'rideengine' || categoryLower === 'ride-engine') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('category');
      params.set('brand', 'ride-engine');
      router.replace(`/shop?${params.toString()}`);
      return;
    }
    if (categoryLower === 'slingshot') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('category');
      params.set('brand', 'slingshot');
      router.replace(`/shop?${params.toString()}`);
    }
  }, [categoryParam, router, searchParams]);

  // Show brand overview only for single brand selection (not when both are selected)
  const isBrandOverview =
    brandParam !== null &&
    (brandParam === 'ride-engine' || brandParam === 'slingshot') &&
    !bothBrandsSelected &&
    !searchParams.has('collection') &&
    !searchParams.has('tag') &&
    !searchParams.has('q') &&
    !searchParams.has('type') &&
    !searchParams.has('category') &&
    parseInt(searchParams.get('page') || '1') === 1;

  const brandLabel =
    brandParam === 'ride-engine'
      ? 'Ride Engine'
      : brandParam === 'slingshot'
        ? 'Slingshot'
        : '';

  // If ANY filter is active, we should NOT show the Featured/BestSellers sections
  // Filters: category, collection, type, tag, brand (single), q
  // Page > 1 also hides them
  // Note: Both brands selected = no brand filter (show all)
  const hasFilters =
    searchParams.has('category') ||
    searchParams.has('collection') ||
    searchParams.has('type') ||
    searchParams.has('tag') ||
    (searchParams.has('brand') && !bothBrandsSelected) ||
    searchParams.has('q') ||
    (parseInt(searchParams.get('page') || '1') > 1);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        params.set('lang', language);
        const res = await fetch(`/api/products?${params.toString()}&limit=12`); // 12 items for grid (3x4 or 4x3)
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
  }, [searchParams, language]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/shop?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const breadcrumbItems = [
    { label: t("breadcrumbs.shop"), href: '/shop' },
    ...(searchParams.get('q') ? [{ label: `${t("shop.search_results")} "${searchParams.get('q')}" ${t("shop.products")}: ${pagination.total}` }] : []),
    ...(searchParams.get('category') ? [{ label: searchParams.get('category')!.toUpperCase() }] : []),
  ];

  const canonicalUrl = buildCanonicalUrlClient(`/shop${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  const baseUrl = canonicalUrl.replace(/\/.+$/, "");
  const breadcrumbSchema = buildBreadcrumbSchema(baseUrl, breadcrumbItems);
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: breadcrumbItems[0]?.label || t("shop.allProducts"),
    url: canonicalUrl,
    description: searchParams.get('q') ? t("shop.search") : t("shop.allProducts"),
  };

  const pageTitle = searchParams.get('q')
    ? `${t("shop.search")} "${searchParams.get('q')}" | Slingshot Bulgaria`
    : `${t("shop.allProducts")} | Slingshot Bulgaria`;
  const pageDescription = searchParams.get('q')
    ? `${t("shop.search")} "${searchParams.get('q')}"`
    : t("shop.allProducts");
  const baseOgImage = `${canonicalUrl.replace(/\/.+$/, "")}/images/og-default.jpg`;

  return (
    <div className="min-h-screen bg-zinc-100 pt-20">
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
      {/* Pass breadcrumbs to Hero to render them inside, bottom-left */}
      <ShopHero
        title={searchParams.get('q') ? t("shop.search") : (searchParams.get('category') || brandLabel || t("shop.allProducts"))}
        breadcrumbs={breadcrumbItems}
        variant={hasFilters ? 'minimal' : 'default'}
      />

      <ShopToolbar facets={facets} totalProducts={pagination.total} />

      <div className="section-container py-12">
        {/* Removed external Breadcrumbs since they are now in Hero */}

        {!hasFilters && !loading && !error && (
          <ShopOverview />
        )}

        {isBrandOverview && !loading && !error && (
          <ShopBrandOverview brandSlug={brandParam || ''} brandLabel={brandLabel} />
        )}

        {error ? (
          <div className="text-center py-20 text-red-500">Error: {error}</div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500 space-y-4">
            <p>{t("shop.noProductsFound")}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <button
                onClick={() => router.push('/shop')}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-900 transition"
              >
                {t("shop.clearFilters") || "Clear filters"}
              </button>
              <button
                onClick={() => router.push('/shop?collection=best-sellers')}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:border-gray-400 transition"
              >
                {t("shop.bestSellers") || "Best sellers"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {hasFilters && !isBrandOverview && <ProductGrid products={products} />}

            {/* Pagination */}
            {hasFilters && !isBrandOverview && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center mt-12 space-x-4">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> {t("shop.previous")}
                </Button>
                <span className="text-sm font-medium">
                  {t("shop.page")} {pagination.page} {t("shop.of")} {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  {t("shop.next")} <ChevronRight className="w-4 h-4 ml-2" />
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
