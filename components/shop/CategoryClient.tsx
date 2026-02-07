"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { buildLocalePath } from "@/lib/i18n/locale-links";

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    badge?: string;
    slug: string;
}

interface CategoryClientProps {
    category: string;
    categoryName: string;
    description: string;
    heroImage: string;
    products: Product[];
}

export function CategoryClient({ category, categoryName, description, heroImage, products }: CategoryClientProps) {
    const { language, t } = useLanguage();

    return (
        <div className="min-h-screen product-listing-bg">
            <main className="">
                <section className="category-hero relative h-[400px]">
                    <img src={heroImage} alt={categoryName} className="image-cover h-full w-full object-cover" />
                    <div className="hero-overlay" />
                    <div className="absolute inset-0 flex items-center">
                        <div className="section-container">
                            <nav className="flex items-center gap-2 text-white/60 text-sm mb-6">
                                <Link href={buildLocalePath("/", language)} className="hover:text-white transition-colors">
                                    {language === "bg" ? "Начало" : "Home"}
                                </Link>
                                <ChevronRight className="w-4 h-4" />
                                <Link href={buildLocalePath("/shop", language)} className="hover:text-white transition-colors">
                                    {language === "bg" ? "Магазин" : "Shop"}
                                </Link>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-white">{categoryName}</span>
                            </nav>
                            <h1 className="text-hero text-white mb-4 text-4xl md:text-6xl font-bold">{categoryName.toUpperCase()}</h1>
                            <p className="text-subhero text-white/80 max-w-2xl">{description}</p>
                        </div>
                    </div>
                </section>

                {products.some((product) => product.badge === "New") && (
                    <section className="section-container section-padding-sm border-b border-border py-12">
                        <h2 className="text-2xl font-bold mb-8">{t("category.new_arrivals")}</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {products
                                .filter((product) => product.badge === "New")
                                .map((product, index) => (
                                    <ProductCard key={product.id} product={product} index={index} />
                                ))}
                        </div>
                    </section>
                )}

                <section className="section-container section-padding py-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold">{t("category.all_products")}</h2>
                        <span className="font-body text-sm text-muted-foreground">
                            {products.length} {t("shop.products")}
                        </span>
                    </div>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {products.map((product, index) => (
                                <ProductCard key={product.id} product={product} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="font-body text-muted-foreground">{t("shop.no_results")}</p>
                        </div>
                    )}
                </section>

                <section className="bg-secondary/30 py-16">
                    <div className="section-container">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white rounded p-6 shadow-sm">
                                <h3 className="font-heading font-medium mb-2">{language === 'bg' ? 'Безплатна доставка' : 'Free Shipping'}</h3>
                                <p className="font-body text-sm text-muted-foreground">{language === 'bg' ? 'За поръчки над 200 лв' : 'On all orders over 200 BGN'}</p>
                            </div>
                            <div className="bg-white rounded p-6 shadow-sm">
                                <h3 className="font-heading font-medium mb-2">{language === 'bg' ? 'Експертен съвет' : 'Expert Advice'}</h3>
                                <p className="font-body text-sm text-muted-foreground">
                                    {language === 'bg' ? 'Нашият екип ще ви помогне' : 'Our team of experienced riders will help you'}
                                </p>
                            </div>
                            <div className="bg-white rounded p-6 shadow-sm">
                                <h3 className="font-heading font-medium mb-2">{language === 'bg' ? '2 години гаранция' : '2 Year Warranty'}</h3>
                                <p className="font-body text-sm text-muted-foreground">{language === 'bg' ? 'За всички Slingshot продукти' : 'On all Slingshot products'}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
