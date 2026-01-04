"use client";

import { Filter, ChevronDown, X } from "lucide-react";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import PriceNote from "@/components/PriceNote";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const products = [
  { id: "1", name: "RPX V2", category: "Kite", price: 1899, image: "/lovable-uploads/rpx-kite.jpg", badge: "New", slug: "rpx-v2" },
  { id: "2", name: "Ghost V3", category: "Kite", price: 1799, originalPrice: 1999, image: "/lovable-uploads/ghost-kite.jpg", badge: "Sale", slug: "ghost-v3" },
  { id: "3", name: "UFO V3", category: "Kite", price: 1699, image: "/lovable-uploads/ufo-kite.jpg", slug: "ufo-v3" },
  { id: "4", name: "Fuse", category: "Kite", price: 1599, image: "/lovable-uploads/fuse-kite.jpg", slug: "fuse" },
  { id: "5", name: "SlingWing V4", category: "Wing", price: 899, image: "/lovable-uploads/slingwing-v4.jpg", badge: "New", slug: "slingwing-v4" },
  { id: "6", name: "SlingWing NXT", category: "Wing", price: 799, image: "/lovable-uploads/slingwing-nxt.jpg", slug: "slingwing-nxt" },
  { id: "7", name: "Formula V3", category: "Board", price: 749, image: "/lovable-uploads/formula-board.jpg", slug: "formula-v3" },
  { id: "8", name: "Sci-Fly XT V2", category: "Board", price: 1299, image: "/lovable-uploads/scifly-board.jpg", slug: "scifly-xt-v2" }
];

const heroImage = "/lovable-uploads/hero-wind.jpg";

const normalize = (value?: string) => value?.toLowerCase() ?? "";

const updateParams = (router: ReturnType<typeof useRouter>, searchParams: URLSearchParams, updates: Record<string, string | undefined>) => {
  const nextParams = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (!value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
  });
  const queryString = nextParams.toString();
  router.replace(queryString ? `/shop?${queryString}` : "/shop");
};

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, t } = useLanguage();

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchQuery
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.category.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCategory = categoryFilter
        ? product.category.toLowerCase() === categoryFilter.toLowerCase()
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const clearSearch = () => updateParams(router, searchParams, { search: undefined });
  const clearCategory = () => updateParams(router, searchParams, { category: undefined });
  const clearFilters = () => router.replace("/shop");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="relative h-48 lg:h-64 animate-fade-in">
          <img src={heroImage} alt="Shop" className="image-cover" />
          <div className="hero-overlay-center" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-white uppercase tracking-tight">{t("shop.title")}</h1>
              <p className="text-base lg:text-lg text-white/80 mt-2 font-body">{t("shop.subtitle")}</p>
            </div>
          </div>
        </section>

        <div className="section-container pt-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <PriceNote />
        </div>

        <div className="section-container py-6 border-b border-border animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-3 flex-wrap items-center">
              <button className="filter-button">
                <Filter className="w-4 h-4" /> {t("shop.filter")}
              </button>
              <button className="filter-button">
                {t("shop.category")} <ChevronDown className="w-4 h-4" />
              </button>
              <button className="filter-button hidden sm:flex">
                {t("shop.price")} <ChevronDown className="w-4 h-4" />
              </button>

              {searchQuery && (
                <span className="filter-tag">
                  "{searchQuery}"
                  <button onClick={clearSearch} className="hover:text-white/60">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter && (
                <span className="filter-tag">
                  {categoryFilter}
                  <button onClick={clearCategory} className="hover:text-white/60">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <span className="font-body text-sm text-muted-foreground">
              {filteredProducts.length} {t("shop.products")}
            </span>
          </div>

          {searchQuery && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="font-body text-muted-foreground">
                {t("shop.search_results")}: <span className="text-foreground font-medium">"{searchQuery}"</span>
              </p>
            </div>
          )}
        </div>

        <div className="section-container section-padding">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <p className="font-heading text-xl text-muted-foreground mb-4">{t("shop.no_results")}</p>
              <button onClick={clearFilters} className="btn-outline">
                {language === "bg" ? "Изчисти филтрите" : "Clear filters"}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

