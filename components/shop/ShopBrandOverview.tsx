"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductSection } from "@/components/products/ProductSection";
import { ArrowRight, Layers } from "lucide-react";
import { ShopCollectionsSection } from "./ShopCollectionsSection";
import { ShopTagsSection } from "./ShopTagsSection";


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
        viewAll: language === 'bg' ? 'Виж Всички' : 'View all',
        noFeatured: language === 'bg' ? 'Все още няма избрани продукти.' : 'No featured products available yet.',
    };

    return (
        <div className="container mx-auto px-4 py-12 space-y-12">
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-hero font-bold text-deep-navy uppercase tracking-tight">
                    {t.heroTitle}
                </h2>
                <p className="text-gray-500 text-sm md:text-base">
                    {t.heroSubtitle}
                </p>
            </div>

            {/* Reusable Collections and Tags sections with space-y-0 gap fix */}
            <div className="space-y-0">
                <ShopCollectionsSection
                    title={t.filterByCollection}
                    collections={displayCollections}
                    getCollectionHref={(collection) => `/shop?brand=${encodeURIComponent(normalizedBrand)}&collection=${encodeURIComponent(collection.slug)}`}
                />

                <ShopTagsSection
                    title={t.filterByTag}
                    keywords={displayKeywords}
                    getKeywordHref={(keyword) => {
                        const tagValue = keyword.slug || keyword.name_en;
                        return `/shop?brand=${encodeURIComponent(normalizedBrand)}&tag=${encodeURIComponent(tagValue)}`;
                    }}
                />
            </div>

            <ProductSection
                title={t.featuredProducts}
                products={displayFeatured}
                columns={4}
                className="space-y-6 pt-12"
                viewAllHref={`/shop?brand=${encodeURIComponent(normalizedBrand)}&collection=featured-products`}
                viewAllText={t.viewAll}
            />
        </div>
    );
}