"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductImage {
    src: string;
    alt: string;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    images: ProductImage[];
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

// Individual product card - text only as requested
function ProductCard({ product }: { product: Product }) {
    return (
        <Link
            href={`/product/${product.slug}`}
            className="group relative aspect-square overflow-hidden rounded-xl bg-deep-navy border border-white/10 hover:border-accent/30 transition-all duration-500 hover:-translate-y-1 flex flex-col items-center justify-center p-6 text-center shadow-lg"
        >
            {/* Minimal Background Pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>

            {/* Product name */}
            <h3 className="font-heading font-semibold text-white text-lg lg:text-xl group-hover:text-accent transition-colors relative z-10">
                {product.name}
            </h3>

            {/* View Button (subtle) */}
            <div className="mt-6 px-5 py-2 rounded-full border border-white/20 text-white/70 text-xs font-medium uppercase tracking-widest group-hover:bg-white group-hover:text-deep-navy group-hover:border-white transition-all duration-300 relative z-10">
                View Product
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </Link>
    );
}

export default function NewProductsFromCollection() {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                // Fetch from featured-products collection
                const res = await fetch(`/api/collections/featured-products?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    // Get random 4 products from the collection
                    const randomProducts = shuffleAndLimit(data.products || [], 4);

                    // Just use the basic product data from the collection fetch
                    const productsList = randomProducts.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        images: [] // Images no longer needed
                    }));

                    setProducts(productsList);
                }
            } catch (error) {
                console.error("Error fetching new products:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [language]);

    if (loading) {
        return (
            <section className="section-padding bg-background">
                <div className="section-container">
                    <div className="text-center mb-10">
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-3" />
                        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
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
        <section className="section-padding bg-background">
            <div className="section-container">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <span className="text-section-title block mb-3">{t("newProducts.label")}</span>
                    <h2 className="h2 text-foreground">{t("newProducts.title")}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
