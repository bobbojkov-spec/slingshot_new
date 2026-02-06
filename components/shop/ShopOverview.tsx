"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductSection } from "@/components/products/ProductSection";
import { ArrowRight, Layers } from "lucide-react";
import { ShopCollectionsSection } from "./ShopCollectionsSection";
import { ShopTagsSection } from "./ShopTagsSection";

// Collection Card Component

type Brand = {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    logo_url_signed?: string | null;
};

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

export default function ShopOverview() {
    const { language } = useLanguage();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [brandsRes, collectionsRes, keywordsRes, featuredRes] = await Promise.all([
                    fetch('/api/shop-brands'),
                    fetch(`/api/homepage-collections?lang=${language}`),
                    fetch(`/api/homepage-keywords?lang=${language}`),
                    fetch(`/api/collections/featured-products?lang=${language}`),
                ]);

                if (brandsRes.ok) {
                    const data = await brandsRes.json();
                    setBrands(data.brands || []);
                }

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
                    const products = (data.products || []).map((product: any) => ({
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        category: product.category || 'Product',
                        image: product.image || product.image_url || '/placeholder.jpg',
                        price: product.price || 0,
                        originalPrice: product.originalPrice || undefined,
                    }));
                    setFeaturedProducts(products);
                }
            } catch (error) {
                console.error('Error loading shop overview data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [language]);

    const displayKeywords = useMemo(() => keywords.slice(0, 12), [keywords]);
    const displayCollections = useMemo(() => collections.slice(0, 12), [collections]);
    const displayBrands = useMemo(() => brands.slice(0, 2), [brands]);
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
            ? 'Разгледай продуктите по филтър или използвай търсачката.'
            : 'Browse products by filter, or use the search bar.',
        heroSubtitle: language === 'bg'
            ? 'Избери марка, колекция или ключова дума за да намериш правилната екипировка.'
            : 'Pick a brand, a collection, or a keyword to jump into the right gear.',
        filterByBrand: language === 'bg' ? 'Филтрирай по Марка' : 'Filter by Brand',
        filterByCollection: language === 'bg' ? 'Филтрирай по Колекция' : 'Filter by Collection',
        filterByTag: language === 'bg' ? 'Филтрирай по Таг' : 'Filter by Tag',
        featuredProducts: language === 'bg' ? 'Избрани Продукти' : 'Featured Products',
        viewAll: language === 'bg' ? 'Виж всички' : 'View all',
        noFeatured: language === 'bg' ? 'Все още няма избрани продукти.' : 'No featured products selected yet.',
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

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-deep-navy">{t.filterByBrand}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayBrands.map((brand) => (
                        <Link
                            key={brand.slug}
                            href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
                            className="group rounded border border-gray-200 bg-white p-6 flex items-center justify-center hover:border-accent hover:shadow-lg transition"
                        >
                            {brand.logo_url_signed || brand.logo_url ? (
                                <img
                                    src={brand.logo_url_signed || brand.logo_url || ''}
                                    alt={brand.name}
                                    className="h-16 object-contain"
                                />
                            ) : (
                                <span className="text-lg font-medium text-deep-navy">
                                    {brand.name}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Groups Collections and Tags to remove gap between them */}
            <div className="space-y-0">
                <ShopCollectionsSection
                    title={t.filterByCollection}
                    collections={displayCollections}
                    getCollectionHref={(collection) => `/shop?collection=${encodeURIComponent(collection.slug)}`}
                />
                <ShopTagsSection
                    title={t.filterByTag}
                    keywords={displayKeywords}
                    getKeywordHref={(keyword) => `/shop?tag=${encodeURIComponent(keyword.name_en)}`}
                />
            </div>

            <ProductSection
                title={t.featuredProducts}
                products={displayFeatured.slice(0, 8)}
                viewAllHref="/collections/featured-products"
                viewAllText={t.viewAll}
                columns={4}
                className="space-y-6 pt-12"
            />
        </div>
    );
}