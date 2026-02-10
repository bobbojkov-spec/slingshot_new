"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
            <section className="section-padding relative" style={{ background: 'linear-gradient(180deg, #9EA5AC 0%, #7E8892 100%)' }}>
                <div className="section-container">
                    <div className="mb-12">
                        <div className="h-7 w-28 bg-white/30 rounded-full animate-pulse mb-4" />
                        <div className="h-10 w-60 bg-white/20 rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 lg:gap-5">
                        <div className="aspect-square bg-white/20 rounded-[24px] animate-pulse" />
                        <div className="grid grid-cols-2 gap-4 lg:gap-5">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="aspect-square bg-white/20 rounded-[20px] animate-pulse" />
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
        <section className="section-padding relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #9EA5AC 0%, #7E8892 100%)' }}>
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '80px 80px',
                }} />

            {/* Ambient background glow */}
            <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px] pointer-events-none" />
            <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

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
                        className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/70 font-semibold hover:border-neon-lime/40 hover:text-neon-lime hover:bg-white/5 transition-all duration-300"
                    >
                        <span>{language === "bg" ? "Виж всички" : "View all"}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 lg:gap-5">
                    {/* Hero Card */}
                    {heroProduct && <Product3DCard product={heroProduct} isHero={true} language={language} />}

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-4 lg:gap-5">
                        {gridProducts.map((product) => (
                            <Product3DCard key={product.id} product={product} language={language} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function Product3DCard({ product, isHero = false, language }: { product: Product; isHero?: boolean; language: string }) {
    const cardRef = useRef<HTMLAnchorElement>(null);
    const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTransform("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
        setIsHovered(false);
    }, []);

    return (
        <Link
            ref={cardRef}
            href={`/product/${product.slug}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setIsHovered(true)}
            className={`group relative overflow-hidden flex flex-col transition-all duration-200 ease-out
                ${isHero ? 'rounded-[24px] shadow-2xl min-h-[500px]' : 'rounded-[20px] shadow-xl aspect-square'}
                bg-slate-900 ring-1 ring-white/10 hover:ring-neon-lime/40`}
            style={{
                transform: transform,
                transformStyle: "preserve-3d",
                perspective: "1000px"
            }}
        >
            {/* Image with zoom effect */}
            <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover pointer-events-none transition-transform duration-700 ease-out group-hover:scale-[1.15]"
                style={{ transform: "translateZ(0)" }}
            />

            {/* Cinematic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 transition-all duration-500 group-hover:from-black/95 group-hover:via-black/40" />

            {/* Shine Sweep Effect - Glossy Flare */}
            <div
                className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%)',
                    transform: 'translateX(-100%) skewX(-15deg)',
                    animation: isHovered ? 'shine-sweep 0.8s ease-out' : 'none'
                }}
            />

            {/* NEW badge */}
            <div className="absolute top-6 left-6 z-30 transform translate-z-20">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-lime text-[11px] font-black uppercase tracking-widest text-black shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    {language === "bg" ? "Ново" : "New"}
                </span>
            </div>

            {/* Content overlay */}
            <div className={`absolute bottom-0 left-0 right-0 z-40 transform translate-z-30 
                ${isHero ? 'p-8 lg:p-10' : 'p-5'}`}>
                {isHero && (
                    <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-neon-lime/80 block mb-3">
                        {product.category}
                    </span>
                )}
                <h3 className={`${isHero ? 'text-2xl sm:text-3xl lg:text-[2.75rem] mb-4' : 'text-sm sm:text-base mb-2'} 
                    font-heading font-black text-white leading-[1.1] tracking-tight drop-shadow-md line-clamp-2`}>
                    {product.name}
                </h3>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-3">
                        <span className={`${isHero ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-xl'} font-black text-white tracking-tighter`}>
                            €{product.price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className={`${isHero ? 'text-lg sm:text-xl' : 'text-sm'} text-white/30 line-through decoration-neon-lime/40`}>
                                €{product.originalPrice.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                            </span>
                        )}
                    </div>
                    <div className={`${isHero ? 'hidden sm:flex py-2 px-5' : 'w-8 h-8'} items-center justify-center rounded-full bg-white/5 border border-white/10 text-white font-bold group-hover:bg-neon-lime group-hover:text-black transition-all duration-300`}>
                        {isHero && <span className="mr-2 text-sm">{language === "bg" ? "Виж" : "Details"}</span>}
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Hover Border Glow */}
            <div
                className="absolute inset-0 rounded-inherit border-2 border-transparent transition-all duration-300 pointer-events-none z-50"
                style={{
                    borderColor: isHovered ? "rgba(204, 255, 0, 0.3)" : "transparent",
                    boxShadow: isHovered ? "0 0 30px rgba(204, 255, 0, 0.1)" : "none"
                }}
            />
        </Link>
    );
}
