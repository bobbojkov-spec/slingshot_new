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
    secondaryImage?: string;
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

                    const productsWithImages = await Promise.all(
                        randomProducts.map(async (p: any) => {
                            let image = p.image || p.image_url || '';
                            let secondaryImage: string | undefined;
                            let category = p.category || 'Product';
                            let price = p.price || 0;
                            let originalPrice = p.originalPrice || undefined;

                            // Fetch full product details to get secondary image
                            try {
                                const productRes = await fetch(`/api/products/${p.slug}?lang=${language}`);
                                if (productRes.ok) {
                                    const productData = await productRes.json();
                                    const prod = productData.product;
                                    if (prod?.images && prod.images.length > 0) {
                                        image = prod.images[0];
                                        secondaryImage = prod.images[1]; // Get secondary image
                                    }
                                    category = prod?.category || category;
                                    price = prod?.price ?? price;
                                    originalPrice = prod?.originalPrice ?? originalPrice;
                                }
                            } catch (e) {
                                console.error(`Error fetching details for ${p.slug}`, e);
                            }

                            return {
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                category,
                                categorySlug: p.categorySlug,
                                price,
                                originalPrice,
                                image,
                                secondaryImage,
                                badge: p.badge || "Best Seller"
                            };
                        })
                    );

                    setProducts(productsWithImages);
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
        <section className="section-padding product-listing-bg">
            <div className="section-container">
                {/* Section Header */}
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <span className="text-section-title block mb-4">{t("bestSellers.label")}</span>
                        <h2 className="h2 text-foreground">{t("bestSellers.title")}</h2>
                    </div>
                    <Link
                        href="/collections/best-sellers"
                        className="group inline-flex items-center gap-2 px-6 py-3 border-2 border-foreground/20 rounded-full text-foreground font-semibold hover:border-foreground hover:bg-foreground hover:text-white transition-all duration-300"
                    >
                        <span>{t("bestSellers.viewAll")}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
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
