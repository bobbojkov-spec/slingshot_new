"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Product {
    id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    secondaryImage?: string;
    badge?: string;
}

export default function NewProductsFromCollection() {
    const { t, language } = useLanguage();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch(`/api/collections/featured-products?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    const fetchedProducts = data.products || [];

                    const productsWithImages = await Promise.all(
                        fetchedProducts.map(async (p: any) => {
                            let image = p.image || p.image_url || '';
                            let secondaryImage: string | undefined;
                            let category = p.category || 'Product';
                            let price = p.price || 0;
                            let originalPrice = p.originalPrice || undefined;

                            const productRes = await fetch(`/api/products/${p.slug}?lang=${language}`);
                            if (productRes.ok) {
                                const productData = await productRes.json();
                                const prod = productData.product;
                                if (prod?.images && prod.images.length > 0) {
                                    image = prod.images[0];
                                    secondaryImage = prod.images[1];
                                }
                                category = prod?.category || category;
                                price = prod?.price ?? price;
                                originalPrice = prod?.originalPrice ?? originalPrice;
                            }

                            return {
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                category,
                                price,
                                originalPrice,
                                image,
                                secondaryImage,
                                badge: "New"
                            };
                        })
                    );

                    setAllProducts(productsWithImages);
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
            <section className="section-padding bg-gradient-to-b from-deep-navy to-[hsl(207,100%,9%)] relative">
                <div className="section-container">
                    <div className="mb-12">
                        <div className="h-7 w-28 bg-white/10 rounded-full animate-pulse mb-4" />
                        <div className="h-10 w-60 bg-white/[0.06] rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 lg:gap-5">
                        <div className="aspect-square bg-white/[0.04] rounded-[24px] animate-pulse" />
                        <div className="grid grid-cols-2 gap-4 lg:gap-5">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="aspect-square bg-white/[0.04] rounded-[20px] animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (allProducts.length === 0) {
        return null;
    }

    const displayProducts = allProducts.slice(0, 5);
    const heroProduct = displayProducts[0];
    const gridProducts = displayProducts.slice(1, 5);

    return (
        <section className="section-padding bg-gradient-to-b from-deep-navy to-[hsl(207,100%,9%)] relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-neon-lime/[0.03] rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-signal-orange/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <div className="section-container relative z-10">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-lime/10 border border-neon-lime/20 mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-neon-lime" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neon-lime">
                                {t("newProducts.label")}
                            </span>
                        </div>
                        <h2 className="h2 text-white">{t("newProducts.title")}</h2>
                    </div>

                    <Link
                        href="/collections/featured-products"
                        className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white/60 font-semibold hover:border-neon-lime/50 hover:text-neon-lime transition-all duration-300"
                    >
                        <span>{language === "bg" ? "Виж всички" : "View all"}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                </div>

                {/* ── Bento Grid ──
                    Desktop (lg):
                    ┌────────────────────┬──────────┬──────────┐
                    │                    │   P2     │   P3     │
                    │   HERO (left)      ├──────────┼──────────┤
                    │                    │   P4     │   P5     │
                    └────────────────────┴──────────┴──────────┘

                    Mobile:
                    ┌──────────────────┐
                    │      HERO        │
                    ├────────┬─────────┤
                    │  P2    │   P3    │
                    ├────────┼─────────┤
                    │  P4    │   P5    │
                    └────────┴─────────┘
                */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 lg:gap-5">

                    {/* ═══ Hero Card (left) ═══ */}
                    {heroProduct && (
                        <Link
                            href={`/product/${heroProduct.slug}`}
                            className="group relative overflow-hidden rounded-[24px] ring-1 ring-white/[0.08] hover:ring-neon-lime/30 transition-all duration-500"
                        >
                            <img
                                src={heroProduct.image}
                                alt={heroProduct.name}
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.06]"
                            />
                            {/* Layered gradient for depth */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

                            {/* NEW badge with glow */}
                            <div className="absolute top-5 left-5 z-10">
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neon-lime text-[11px] font-extrabold uppercase tracking-wider text-black shadow-[0_0_30px_rgba(204,255,0,0.35)]">
                                    <Sparkles className="w-3 h-3" />
                                    {language === "bg" ? "Ново" : "New"}
                                </span>
                            </div>

                            {/* Content overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 lg:p-8">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 block mb-2">
                                    {heroProduct.category}
                                </span>
                                <h3 className="text-xl sm:text-2xl lg:text-[2.5rem] font-heading font-extrabold text-white leading-[1.1] mb-3 tracking-tight">
                                    {heroProduct.name}
                                </h3>
                                <div className="flex items-end justify-between gap-4">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                                            €{heroProduct.price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                        </span>
                                        {heroProduct.originalPrice && heroProduct.originalPrice > heroProduct.price && (
                                            <span className="text-base sm:text-lg text-white/30 line-through">
                                                €{heroProduct.originalPrice.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/40 font-medium group-hover:text-neon-lime transition-colors duration-300">
                                        {language === "bg" ? "Виж продукта" : "Shop now"}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                    </span>
                                </div>
                            </div>

                            {/* Hover shine sweep */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1200ms] ease-out" />
                            </div>
                        </Link>
                    )}

                    {/* ═══ 2×2 Grid (right) ═══ */}
                    <div className="grid grid-cols-2 gap-4 lg:gap-5">
                        {gridProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                className="group relative overflow-hidden rounded-[20px] ring-1 ring-white/[0.08] hover:ring-white/20 transition-all duration-500 hover:-translate-y-1 aspect-square"
                            >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    loading="lazy"
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                />

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5 group-hover:from-black/95 transition-all duration-500" />

                                {/* NEW badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span className="inline-block px-2.5 py-[3px] rounded-full bg-neon-lime text-[10px] font-extrabold uppercase tracking-wider text-black">
                                        {language === "bg" ? "Ново" : "New"}
                                    </span>
                                </div>

                                {/* Content - slides up on hover */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-0 group-hover:-translate-y-1 transition-transform duration-500">
                                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1.5 tracking-tight font-heading">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-extrabold text-white tracking-tight">
                                            €{product.price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                        </span>
                                        <span className="text-white/0 group-hover:text-white/50 transition-all duration-300 text-xs font-medium flex items-center gap-1">
                                            {language === "bg" ? "Виж" : "View"}
                                            <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
