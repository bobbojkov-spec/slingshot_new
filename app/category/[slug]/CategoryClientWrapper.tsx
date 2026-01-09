"use client";

import React from 'react';
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    badge?: string;
    slug: string;
    inStock?: boolean;
}

interface CategoryClientWrapperProps {
    categorySlug: string;
    initialProducts: Product[];
    categoryHero: {
        heroImage: string;
        descriptionEn: string;
        descriptionBg: string;
    };
    categoryNames: {
        en: string;
        bg: string;
    }
}

export default function CategoryClientWrapper({
    categorySlug,
    initialProducts,
    categoryHero,
    categoryNames
}: CategoryClientWrapperProps) {
    const { language, t } = useLanguage();

    const categoryName = language === "bg" ? categoryNames.bg : categoryNames.en;
    const description = language === "bg" ? categoryHero.descriptionBg : categoryHero.descriptionEn;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-20">
                <section className="relative h-[50vh] lg:h-[60vh]">
                    <img src={categoryHero.heroImage} alt={categoryName} className="image-cover" />
                    <div className="hero-overlay" />
                    <div className="absolute inset-0 flex items-center">
                        <div className="section-container">
                            <nav className="flex items-center gap-2 text-white/60 text-sm mb-6">
                                <Link href="/" className="hover:text-white transition-colors">
                                    {language === "bg" ? "Начало" : "Home"}
                                </Link>
                                <ChevronRight className="w-4 h-4" />
                                <Link href="/shop" className="hover:text-white transition-colors">
                                    {language === "bg" ? "Магазин" : "Shop"}
                                </Link>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-white">{categoryName}</span>
                            </nav>
                            <h1 className="text-hero text-white mb-4">{categoryName.toUpperCase()}</h1>
                            <p className="text-subhero text-white/80 max-w-2xl">{description}</p>
                        </div>
                    </div>
                </section>

                {initialProducts.some((product) => product.badge === "New") && (
                    <section className="section-container section-padding-sm border-b border-border">
                        <h2 className="text-section-title mb-8">{t("category.new_arrivals")}</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {initialProducts
                                .filter((product) => product.badge === "New")
                                .map((product, index) => (
                                    <ProductCard key={product.id} product={product} index={index} />
                                ))}
                        </div>
                    </section>
                )}

                <section className="section-container section-padding">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-section-title">{t("category.all_products")}</h2>
                        <span className="font-body text-sm text-muted-foreground">
                            {initialProducts.length} {t("shop.products")}
                        </span>
                    </div>

                    {initialProducts.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {initialProducts.map((product, index) => (
                                <ProductCard key={product.id} product={product} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="font-body text-muted-foreground">{t("shop.no_results")}</p>
                        </div>
                    )}
                </section>

                <section className="bg-secondary/30 section-padding">
                    <div className="section-container">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-background rounded-xl p-6">
                                <h3 className="font-heading font-semibold mb-2">Free Shipping</h3>
                                <p className="font-body text-sm text-muted-foreground">On all orders over 200 BGN</p>
                            </div>
                            <div className="bg-background rounded-xl p-6">
                                <h3 className="font-heading font-semibold mb-2">Expert Advice</h3>
                                <p className="font-body text-sm text-muted-foreground">
                                    Our team of experienced riders will help you
                                </p>
                            </div>
                            <div className="bg-background rounded-xl p-6">
                                <h3 className="font-heading font-semibold mb-2">2 Year Warranty</h3>
                                <p className="font-body text-sm text-muted-foreground">On all Slingshot products</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
