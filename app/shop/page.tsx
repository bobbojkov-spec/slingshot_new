'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Breadcrumbs } from '@/components/shop/Breadcrumbs';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ShopHero } from '@/components/shop/ShopHero';
import { FloatingWarning } from '@/components/FloatingWarning';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState({ categories: [], types: [], tags: [], brands: [] });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // If we are in the middle of redirecting to default category, wait?
        // No, current params are used. If params change, effect re-runs.

        const params = new URLSearchParams(searchParams.toString());
        // If no category yet (initial load before redirect), don't fetch or fetch everything?
        // Let's fetch whatever params say.

        const res = await fetch(`/api/products?${params.toString()}&limit=12`); // 12 items for grid (3x4 or 4x3)
        if (!res.ok) throw new Error('Failed to fetch products');

        const data = await res.json();
        setProducts(data.products);
        setFacets(data.facets || { categories: [], types: [], tags: [] });
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
    router.push(`/shop?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const breadcrumbItems = [
    { label: 'Shop', href: '/shop' },
    ...(searchParams.get('category') ? [{ label: searchParams.get('category')!.toUpperCase() }] : []),
  ];

  return (
    <div className="min-h-screen bg-white">
      <ShopHero title={searchParams.get('category') || 'Shop'} />

      <ShopToolbar facets={facets} totalProducts={pagination.total} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {error ? (
          <div className="text-center py-20 text-red-500">Error: {error}</div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No products found matching your criteria.</div>
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
