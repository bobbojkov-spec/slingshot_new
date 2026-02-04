"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ProductCard from "@/components/ProductCard";

interface Product {
    id: string;
    name: string;
    slug: string;
    category: string;
    categorySlug?: string;
    price: number;
    originalPrice?: number;
    image: string;
    badge?: string;
}

// Shuffle and limit array
function shuffleAndLimit<T>(array: T[], limit: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, limit);
}

export default function BestSellersFromCollection() {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                // Fetch from best-sellers collection
                const res = await fetch(`/api/collections/best-sellers?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    // Get random 8 products from the collection
                    const randomProducts = shuffleAndLimit(data.products || [], 8);
                    setProducts(randomProducts.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        category: p.category || 'Product',
                        categorySlug: p.categorySlug,
                        price: p.price || 0,
                        originalPrice: p.originalPrice,
                        image: p.image || p.image_url || '',
                        badge: p.badge
                    })));
                }
            } catch (error) {
                console.error("Error fetching best sellers:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [language]);

    if (loading) {
        return (
            <section className="section-padding bg-secondary/30">
                <div className="section-container">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="section-padding bg-secondary/30">
            <div className="section-container">
                {/* Section Header */}
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <span className="text-section-title block mb-4">{t("bestSellers.label")}</span>
                        <h2 className="h2 text-foreground">{t("bestSellers.title")}</h2>
                    </div>
                    <Link
                        href="/collections/best-sellers"
                        className="hidden sm:inline-flex items-center gap-2 font-heading font-medium text-primary hover:text-accent transition-colors uppercase tracking-wider text-sm"
                    >
                        {t("bestSellers.viewAll")}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Products Grid - Desktop: 4x2 (8 products), Mobile: 2x6 (12 visible but we have 8) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {products.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                    ))}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <Link href="/collections/best-sellers" className="btn-outline">
                        {t("bestSellers.viewAllProducts")}
                    </Link>
                </div>
            </div>
        </section>
    );
}
