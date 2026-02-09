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
            <section className="section-padding bg-slate-950 relative">
                <div className="section-container">
                    <div className="mb-12">
                        <div className="h-7 w-28 bg-slate-800/50 rounded-full animate-pulse mb-4" />
                        <div className="h-10 w-60 bg-slate-800/30 rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 lg:gap-5">
                        <div className="aspect-square bg-slate-900/40 rounded-[24px] animate-pulse" />
                        <div className="grid grid-cols-2 gap-4 lg:gap-5">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="aspect-square bg-slate-900/40 rounded-[20px] animate-pulse" />
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
        <section className="section-padding bg-slate-950 relative overflow-hidden">
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            {/* Ambient background glow - Cinematic tones for dark background */}
            <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[180px] pointer-events-none" />
            <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[200px] pointer-events-none" />

            <div className="section-container relative z-10">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
                    <div className="animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-lime/10 border border-neon-lime/20 mb-4 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                            <Sparkles className="w-3.5 h-3.5 text-neon-lime" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neon-lime">
                                {t("newProducts.label")}
                            </span>
                        </div>
                        <h2 className="h2 text-white drop-shadow-sm">{t("newProducts.title")}</h2>
                    </div>

                    <Link
                        href="/collections/featured-products"
                        className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/50 font-semibold hover:border-neon-lime/40 hover:text-neon-lime hover:bg-white/5 transition-all duration-300"
                    >
                        <span>{language === "bg" ? "Виж всички" : "View all"}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 lg:gap-5">

                    {/* ═══ Hero Card (left) ═══ */}
                    {heroProduct && (
                        <Link
                            href={`/product/${heroProduct.slug}`}
                            className="group relative overflow-hidden rounded-[24px] shadow-2xl shadow-black/80 ring-1 ring-white/10 transition-all duration-700 hover:ring-neon-lime/40 hover:-translate-y-2 block bg-slate-900"
                        >
                            <img
                                src={heroProduct.image}
                                alt={heroProduct.name}
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110"
                            />
                            {/* Layered cinematic gradients */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            {/* GLASS EFFECT OVERLAY (HOVER) */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-[2px] bg-white/[0.02]" />

                            {/* NEW badge with intense glow */}
                            <div className="absolute top-6 left-6 z-10">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-lime text-[11px] font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {language === "bg" ? "Ново" : "New"}
                                </span>
                            </div>

                            {/* Content overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10 z-20">
                                <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-neon-lime/70 block mb-3 animate-pulse">
                                    {heroProduct.category}
                                </span>
                                <h3 className="text-2xl sm:text-3xl lg:text-[2.75rem] font-heading font-black text-white leading-[1.05] mb-4 tracking-tighter drop-shadow-lg">
                                    {heroProduct.name}
                                </h3>
                                <div className="flex items-end justify-between gap-6">
                                    <div className="flex items-baseline gap-4">
                                        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter shadow-black drop-shadow-md">
                                            €{heroProduct.price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                        </span>
                                        {heroProduct.originalPrice && heroProduct.originalPrice > heroProduct.price && (
                                            <span className="text-lg sm:text-xl text-white/30 line-through decoration-neon-lime/40">
                                                €{heroProduct.originalPrice.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden sm:inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/5 border border-white/10 text-sm text-white font-bold group-hover:bg-neon-lime group-hover:text-black transition-all duration-500 shadow-lg">
                                        {language === "bg" ? "Детайли" : "See Details"}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* ═══ 2×2 Grid (right) ═══ */}
                    <div className="grid grid-cols-2 gap-4 lg:gap-5">
                        {gridProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                className="group relative overflow-hidden rounded-[20px] shadow-xl shadow-black ring-1 ring-white/5 hover:ring-neon-lime/30 transition-all duration-500 hover:-translate-y-2 aspect-square block bg-slate-900"
                            >
                                <div className="absolute inset-0">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-115"
                                    />
                                </div>

                                {/* Cinematic Overlays */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent group-hover:from-black/95 transition-all duration-500" />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[1px] bg-white/[0.01]" />

                                {/* NEW badge */}
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="inline-block px-3 py-1 rounded-full bg-neon-lime text-[10px] font-black uppercase tracking-wider text-black shadow-lg">
                                        {language === "bg" ? "Ново" : "New"}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight line-clamp-2 mb-2 tracking-tight font-heading drop-shadow-md">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-black text-white tracking-tighter">
                                                €{product.price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white ring-1 ring-white/20 group-hover:bg-neon-lime group-hover:text-black group-hover:ring-neon-lime transition-all duration-500">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
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
    );
}
