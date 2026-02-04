"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const products = [
  {
    id: "rpx-v2",
    name: "RPX V2",
    category: "Kite",
    price: 1899,
    image: "/lovable-uploads/rpx-kite.jpg",
    badge: "New",
    slug: "rpx-v2"
  },
  {
    id: "ghost-v3",
    name: "Ghost V3",
    category: "Kite",
    price: 1799,
    originalPrice: 1999,
    image: "/lovable-uploads/ghost-kite.jpg",
    badge: "Sale",
    slug: "ghost-v3"
  },
  {
    id: "slingwing-v4",
    name: "SlingWing V4",
    category: "Wing",
    price: 899,
    image: "/lovable-uploads/slingwing-v4.jpg",
    badge: "New",
    slug: "slingwing-v4"
  },
  {
    id: "formula-v3",
    name: "Formula V3",
    category: "Board",
    price: 749,
    image: "/lovable-uploads/formula-board.jpg",
    slug: "formula-v3"
  }
];

const BestSellers = () => {
  const { t } = useLanguage();
  return (
    <section className="section-padding bg-secondary/30">
      <div className="section-container">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-section-title block mb-4">{t("bestSellers.label")}</span>
            <h2 className="h2 text-foreground">{t("bestSellers.title")}</h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-2 font-heading font-medium text-primary hover:text-accent transition-colors uppercase tracking-wider text-sm"
          >
            {t("bestSellers.viewAll")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.slice(0, 2).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
          {products.slice(2, 4).map((product, index) => (
            <div key={product.id} className="hidden lg:block">
              <ProductCard product={product} index={index + 2} />
            </div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/shop" className="btn-outline">
            {t("bestSellers.viewAllProducts")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;

