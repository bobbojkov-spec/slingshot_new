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
    const [newProducts, setNewProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const normalizedBrand = normalizeBrandSlug(brandSlug);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [collectionsRes, keywordsRes] = await Promise.all([
                    fetch(`/api/homepage-collections?lang=${language}&brand=${normalizedBrand}`),
                    fetch(`/api/homepage-keywords?lang=${language}&brand=${normalizedBrand}`),
                ]);

                if (collectionsRes.ok) {
                    const data = await collectionsRes.json();
                    setCollections(data.collections || []);
                }

                if (keywordsRes.ok) {
                    const data = await keywordsRes.json();
                    setKeywords(data.keywords || []);
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
    const displayKeywords = useMemo(() => keywords.slice(0, 16), [keywords]);

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

    return (
        <div className="container mx-auto px-4 py-12 space-y-12">
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-logo font-bold text-deep-navy uppercase tracking-tight">
                    {brandLabel} gear, filtered and ready to ride.
                </h2>
                <p className="text-gray-500 text-sm md:text-base">
                    New arrivals, featured collections, and keywords all filtered for {brandLabel}.
                </p>
            </div>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-deep-navy">New Products</h3>
                </div>
                {newProducts.length === 0 ? (
                    <p className="text-gray-500">No new products available yet.</p>
                ) : (
                    <ProductGrid products={newProducts} columns={4} />
                )}
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-deep-navy">Collections</h3>
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
                                <h4 className="text-white text-base md:text-lg font-medium uppercase tracking-tight">
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

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-deep-navy">Keywords</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                    {displayKeywords.map((keyword) => {
                        const label = language === "bg" ? keyword.name_bg : keyword.name_en;
                        const tagValue = keyword.slug || keyword.name_en;
                        return (
                            <Link
                                key={keyword.slug}
                                href={`/shop?brand=${encodeURIComponent(normalizedBrand)}&tag=${encodeURIComponent(
                                    tagValue
                                )}`}
                                className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-deep-navy hover:bg-accent hover:text-white transition"
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}