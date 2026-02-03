"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProductGrid } from "@/components/products/ProductGrid";

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
    const displayCollections = useMemo(() => collections.slice(0, 8), [collections]);
    const displayBrands = useMemo(() => brands.slice(0, 2), [brands]);
    const displayFeatured = useMemo(() => featuredProducts.slice(0, 8), [featuredProducts]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-10">
                <div className="animate-pulse space-y-6">
                    <div className="h-6 w-64 bg-gray-200 rounded" />
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(2)].map((_, idx) => (
                            <div key={idx} className="h-28 bg-gray-200 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10 space-y-12">
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-logo font-bold text-deep-navy uppercase tracking-tight">
                    Browse products by filter, or use the search bar.
                </h2>
                <p className="text-gray-500 text-sm md:text-base">
                    Pick a brand, a collection, or a keyword to jump into the right gear.
                </p>
            </div>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-deep-navy">Filter by Brand</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayBrands.map((brand) => (
                        <Link
                            key={brand.slug}
                            href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
                            className="group rounded-2xl border border-gray-200 bg-white p-6 flex items-center justify-center hover:border-accent hover:shadow-lg transition"
                        >
                            {brand.logo_url_signed || brand.logo_url ? (
                                <img
                                    src={brand.logo_url_signed || brand.logo_url || ''}
                                    alt={brand.name}
                                    className="h-16 object-contain"
                                />
                            ) : (
                                <span className="text-lg font-semibold text-deep-navy">
                                    {brand.name}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-deep-navy">Filter by Collection</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {displayCollections.map((collection) => (
                        <Link
                            key={collection.id}
                            href={`/shop?collection=${encodeURIComponent(collection.slug)}`}
                            className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition"
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
                                <h4 className="text-white text-sm font-semibold uppercase tracking-tight">
                                    {collection.title}
                                </h4>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-deep-navy">Filter by Tag</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {displayKeywords.map((keyword) => {
                        const label = language === 'bg' ? keyword.name_bg : keyword.name_en;
                        return (
                            <Link
                                key={keyword.slug}
                                href={`/shop?tag=${encodeURIComponent(keyword.name_en)}`}
                                className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-deep-navy hover:bg-accent hover:text-white transition"
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-deep-navy">Featured Products</h3>
                    <Link href="/collections/featured-products" className="text-sm text-accent">
                        View all
                    </Link>
                </div>
                {displayFeatured.length === 0 ? (
                    <p className="text-gray-500">No featured products selected yet.</p>
                ) : (
                    <ProductGrid products={displayFeatured} columns={4} />
                )}
            </section>
        </div>
    );
}