"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const categories = [
  {
    key: "kites",
    image: "/lovable-uploads/machine.jpg",
    href: "/shop?category=kites"
  },
  {
    key: "boards",
    image: "/lovable-uploads/kitefoil.jpg",
    href: "/shop?category=boards"
  },
  {
    key: "wings",
    image: "/lovable-uploads/quickflite.jpg",
    href: "/shop?category=wings"
  },
  {
    key: "foils",
    image: "/lovable-uploads/wavemastery.jpg",
    href: "/shop?category=foils"
  },
  {
    key: "accessories",
    image: "/lovable-uploads/wavemastery.jpg",
    href: "/shop?category=accessories"
  }
];

const CategoryGrid = () => {
  const { t } = useLanguage();
  return (
    <section className="section-padding bg-background">
      <div className="section-container">
        <div className="text-center mb-12">
          <span className="text-section-title block mb-3">{t("categories.browseLabel")}</span>
          <h2 className="h2 text-foreground">{t("categories.sectionTitle")}</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.key}
              href={category.href}
              className="category-card group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={category.image}
                alt={`${t(`categories.names.${category.key}`)} Gear - Slingshot Bulgaria`}
                className="image-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="category-card-overlay" />
              <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6">
                <h3 className="font-heading font-semibold text-white text-lg lg:text-xl uppercase tracking-wide mb-1">
                  {t(`categories.names.${category.key}`)}
                </h3>
                <p className="font-body text-white/70 text-sm hidden lg:block">
                  {t(`categories.descriptions.${category.key}`)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;

