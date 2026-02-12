"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
                const res = await fetch(`/api/collections/new-products?lang=${language}`);
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
            <section className="section-padding bg-[#F7F8FA]">
                <div className="section-container">
                    <div className="mb-10">
                        <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse mb-3" />
                        <div className="h-9 w-56 bg-gray-200/70 rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5 lg:gap-6">
                        <div className="bg-white rounded-2xl animate-pulse overflow-hidden shadow-sm">
                            <div className="aspect-[4/5] bg-gray-100" />
                            <div className="p-6 space-y-3">
                                <div className="h-3 w-20 bg-gray-100 rounded" />
                                <div className="h-5 w-3/4 bg-gray-100 rounded" />
                                <div className="h-7 w-24 bg-gray-100 rounded" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5 lg:gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl animate-pulse overflow-hidden shadow-sm">
                                    <div className="aspect-square bg-gray-100" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-3 w-16 bg-gray-100 rounded" />
                                        <div className="h-4 w-full bg-gray-100 rounded" />
                                        <div className="h-5 w-20 bg-gray-100 rounded" />
                                    </div>
                                </div>
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
        <section className="section-padding bg-[#F7F8FA]">
            <div className="section-container">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                    <div className="animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900 mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                                {t("newProducts.label")}
                            </span>
                        </div>
                        <h2 className="h2 text-gray-900">{t("newProducts.title")}</h2>
                    </div>

                    <Link
                        href="/collections/new-products"
                        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-gray-500 font-semibold text-sm hover:border-gray-900 hover:text-gray-900 hover:bg-white transition-all duration-300"
                    >
                        <span>{language === "bg" ? "Виж всички" : "View all"}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5 lg:gap-6">
                    {/* Hero Card */}
                    {heroProduct && (
                        <Link
                            href={`/product/${heroProduct.slug}`}
                            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col"
                        >
                            {/* Image */}
                            <div className="relative flex-1 min-h-[320px] lg:min-h-0 overflow-hidden bg-gray-50">
                                <img
                                    src={heroProduct.image}
                                    alt={heroProduct.name}
                                    loading="eager"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                                {/* Badge */}
                                <div className="absolute top-5 left-5 z-10">
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                                        {language === "bg" ? "Ново" : "New"}
                                    </span>
                                </div>
                            </div>
                            {/* Info */}
                            <div className="p-6 lg:p-8">
                                <span className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-semibold block">
                                    {heroProduct.category}
                                </span>
                                <h3 className="font-heading font-bold text-xl lg:text-2xl text-gray-900 mt-1.5 leading-tight line-clamp-2">
                                    {heroProduct.name}
                                </h3>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
                                            €{heroProduct.price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                        </span>
                                        {heroProduct.originalPrice && heroProduct.originalPrice > heroProduct.price && (
                                            <span className="text-base text-gray-400 line-through">
                                                €{heroProduct.originalPrice.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 group-hover:text-accent transition-colors duration-300">
                                        <span className="hidden sm:inline">{language === "bg" ? "Виж" : "Details"}</span>
                                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-5 lg:gap-6">
                        {gridProducts.map((product, index) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                {/* Image */}
                                <div className="aspect-square relative overflow-hidden bg-gray-50">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        loading="lazy"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                    />
                                    {/* Badge */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                            {language === "bg" ? "Ново" : "New"}
                                        </span>
                                    </div>
                                </div>
                                {/* Info */}
                                <div className="p-3.5 sm:p-4">
                                    <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-medium block">
                                        {product.category}
                                    </span>
                                    <h3 className="font-heading font-semibold text-sm text-gray-900 mt-1 leading-snug line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-lg font-bold text-gray-900 tracking-tight">
                                            €{product.price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                        </span>
                                        {product.originalPrice && product.originalPrice > product.price && (
                                            <span className="text-xs text-gray-400 line-through">
                                                €{product.originalPrice.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                            </span>
                                        )}
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
