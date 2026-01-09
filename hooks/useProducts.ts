import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    badge?: string;
    slug: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface UseProductsResult {
    products: Product[];
    pagination: Pagination | null;
    loading: boolean;
    error: string | null;
    setPage: (page: number) => void;
}

export function useProducts(initialLimit: number = 10) {
    const { language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let isMounted = true;

        async function fetchProducts() {
            setLoading(true);
            setError(null);
            try {
                const langParam = language === 'bg' ? 'bg' : 'en';
                const res = await fetch(`/api/products?lang=${langParam}&page=${page}&limit=${initialLimit}`);

                if (!res.ok) {
                    throw new Error(`Failed to fetch products: ${res.status}`);
                }

                const data = await res.json();

                if (isMounted) {
                    setProducts(data.products);
                    setPagination(data.pagination);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error('Error fetching products:', err);
                    setError(err.message || 'Failed to load products');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchProducts();

        return () => {
            isMounted = false;
        };
    }, [page, initialLimit, language]);

    return { products, pagination, loading, error, setPage };
}
