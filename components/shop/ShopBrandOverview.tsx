"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProductGrid } from "@/components/products/ProductGrid";

type Collection = {
    id: string;
    title: string;
    subtitle?: string;
    slug: string;
    source: string;
    image_url: string | null;
};

type Keyword = {
    name_en: string;
    name_bg: string;
    slug: string;
};

type Product = {
    id: string;
    name: string;
    slug: string;
    category: string;
    image: string;
    price: number;
    originalPrice?: number;
};

interface ShopBrandOverviewProps {
    brandSlug: string;
    brandLabel: string;
}

const normalizeBrandSlug = (brandSlug: string) =>
    brandSlug.toLowerCase() === "rideengine" ? "ride-engine" : brandSlug.toLowerCase();

export default function ShopBrandOverview({ brandSlug, brandLabel }: ShopBrandOverviewProps) {
    const { language } = useLanguage();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [newProducts, setNewProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const normalizedBrand = normalizeBrandSlug(brandSlug);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [collectionsRes, keywordsRes, featuredRes] = await Promise.all([
                    fetch(`/api/homepage-collections?lang=${language}&brand=${normalizedBrand}`),
                    fetch(`/api/homepage-keywords?lang=${language}&brand=${normalizedBrand}`),
                    fetch(`/api/products?lang=${language}&brand=${encodeURIComponent(normalizedBrand)}&collection=featured-products&limit=8`),
                ]);

                if (collectionsRes.ok) {
                    const data = await collectionsRes.json();
                    setCollections(data.collections || []);
                }

                if (keywordsRes.ok) {
                    const data = await keywordsRes.json();
                    setKeywords(data.keywords || []);
                }

                if (featuredRes.ok) {
                    const data = await featuredRes.json();
                    setFeaturedProducts(data.products || []);
                }

                const newProductsRes = await fetch(
                    `/api/products?lang=${language}&brand=${encodeURIComponent(normalizedBrand)}&tag=New&limit=4`
                );

                let newProductsData = [] as Product[];
                if (newProductsRes.ok) {
                    const data = await newProductsRes.json();
                    newProductsData = data.products || [];
                }

                if (newProductsData.length === 0) {
                    const fallbackRes = await fetch(
                        `/api/products?lang=${language}&brand=${encodeURIComponent(normalizedBrand)}&limit=4`
                    );
                    if (fallbackRes.ok) {
                        const data = await fallbackRes.json();
                        newProductsData = data.products || [];
                    }
                }

                setNewProducts(newProductsData);
            } catch (error) {
                console.error("Error loading brand overview data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [language, normalizedBrand]);

    const displayCollections = useMemo(() => collections.slice(0, 12), [collections]);
    const displayKeywords = useMemo(() => keywords.slice(0, 12), [keywords]);
    const displayFeatured = useMemo(() => featuredProducts.slice(0, 8), [featuredProducts]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="animate-pulse space-y-6">
                    <div className="h-6 w-64 bg-gray-200 rounded" />
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(2)].map((_, idx) => (
                            <div key={idx} className="h-28 bg-gray-200 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Translations
    const t = {
        heroTitle: language === 'bg'
            ? `${brandLabel} екипировка, филтрирана и готова за каране.`
            : `${brandLabel} gear, filtered and ready to ride.`,
        heroSubtitle: language === 'bg'
            ? `Нови продукти, избрани колекции и тагове, филтрирани за ${brandLabel}.`
            : `New arrivals, featured collections, and tags all filtered for ${brandLabel}.`,
        filterByCollection: language === 'bg' ? 'Филтрирай по Колекция' : 'Filter by Collection',
        filterByTag: language === 'bg' ? 'Филтрирай по Таг' : 'Filter by Tag',
        featuredProducts: language === 'bg' ? 'Избрани Продукти' : 'Featured Products',
        newProducts: language === 'bg' ? 'Нови Продукти' : 'New Products',
        noFeatured: language === 'bg' ? 'Все още няма избрани продукти.' : 'No featured products available yet.',
        noNew: language === 'bg' ? 'Все още няма нови продукти.' : 'No new products available yet.',
    };

    return (
        <div className="container mx-auto px-4 py-12 space-y-12">
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-logo font-bold text-deep-navy uppercase tracking-tight">
                    {t.heroTitle}
                </h2>
                <p className="text-gray-500 text-sm md:text-base">
                    {t.heroSubtitle}
                </p>
            </div>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-deep-navy">{t.filterByCollection}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {displayCollections.map((collection) => (
                        <Link
                            key={collection.id}
                            href={`/shop?brand=${encodeURIComponent(normalizedBrand)}&collection=${encodeURIComponent(
                                collection.slug
                            )}`}
                            className="group relative aspect-[16/9] rounded overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition"
                        >
                            {collection.image_url ? (
                                <img
                                    src={collection.image_url}
                                    alt={collection.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-100" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute inset-0 flex flex-col justify-end p-3">
                                <h4 className="text-white text-base md:text-lg font-bold uppercase tracking-tight">
                                    {collection.title}
                                </h4>
                                {collection.subtitle && (
                                    <p className="text-white/80 text-xs md:text-sm mt-2 line-clamp-2">
                                        {collection.subtitle}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Filter by Tag — Full-bleed colorful section */}
            <section
                className="relative py-10 md:py-14 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 overflow-hidden"
                style={{
                    marginLeft: 'calc(-50vw + 50%)',
                    marginRight: 'calc(-50vw + 50%)',
                    width: '100vw',
                }}
            >
                {/* Colorful gradient background */}
                <div
                    className="absolute inset-0 -z-10"
                    style={{
                        background: 'linear-gradient(135deg, hsl(29 100% 92%) 0%, hsl(36 100% 88%) 20%, hsl(170 60% 85%) 50%, hsl(207 60% 85%) 75%, hsl(260 50% 90%) 100%)',
                    }}
                />
                {/* Subtle decorative blobs */}
                <div
                    className="absolute -z-[5] rounded-full blur-3xl opacity-40"
                    style={{
                        width: '400px',
                        height: '400px',
                        top: '-120px',
                        left: '10%',
                        background: 'radial-gradient(circle, hsl(29 100% 70%) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="absolute -z-[5] rounded-full blur-3xl opacity-30"
                    style={{
                        width: '350px',
                        height: '350px',
                        bottom: '-100px',
                        right: '15%',
                        background: 'radial-gradient(circle, hsl(207 80% 70%) 0%, transparent 70%)',
                    }}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h3 className="text-lg md:text-xl font-heading font-semibold text-deep-navy/80 mb-6 tracking-wide uppercase">
                        {t.filterByTag}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {displayKeywords.map((keyword) => {
                            const label = language === "bg" ? keyword.name_bg : keyword.name_en;
                            const tagValue = keyword.slug || keyword.name_en;
                            return (
                                <Link
                                    key={keyword.slug}
                                    href={`/shop?brand=${encodeURIComponent(normalizedBrand)}&tag=${encodeURIComponent(
                                        tagValue
                                    )}`}
                                    className="px-5 py-2.5 rounded-full bg-white text-sm font-semibold text-deep-navy shadow-md hover:shadow-xl hover:bg-accent hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out border border-white/60"
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-deep-navy">{t.featuredProducts}</h3>
                </div>
                {displayFeatured.length === 0 ? (
                    <p className="text-gray-500">{t.noFeatured}</p>
                ) : (
                    <ProductGrid products={displayFeatured} columns={4} />
                )}
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-deep-navy">{t.newProducts}</h3>
                </div>
                {newProducts.length === 0 ? (
                    <p className="text-gray-500">{t.noNew}</p>
                ) : (
                    <ProductGrid products={newProducts} columns={4} />
                )}
            </section>
        </div>
    );
}