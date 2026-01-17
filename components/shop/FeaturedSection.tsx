import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/products/ProductGrid';
import Link from 'next/link';
import { ReadonlyURLSearchParams } from 'next/navigation';

interface FeaturedSectionProps {
    searchParams: URLSearchParams | ReadonlyURLSearchParams | null;
}

export function FeaturedSection({ searchParams }: FeaturedSectionProps) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            setLoading(true);
            try {
                // Fetch featured products (using collection)
                // Append current filters (category, brand, etc) EXCEPT 'collection' since we specify one
                const params = new URLSearchParams();
                params.set('collection', 'featured-products');
                params.set('limit', '8');

                if (searchParams) {
                    searchParams.forEach((value, key) => {
                        if (key !== 'collection' && key !== 'page' && key !== 'limit' && key !== 'q') {
                            params.append(key, value);
                        }
                    });
                }

                const res = await fetch(`/api/products?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products);
                }
            } catch (e) {
                console.error("Failed to fetch featured products", e);
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();
    }, [searchParams]);

    if (!loading && products.length === 0) return null;

    return (
        <div className="container mx-auto px-4 py-12 border-b border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-heading font-bold uppercase tracking-tight">Featured Products</h2>
            </div>
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="aspect-[4/5] bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            ) : (
                <ProductGrid products={products} columns={4} />
            )}
        </div>
    );
}
