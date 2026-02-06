"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductSectionProps {
    title: string;
    subtitle?: string;
    products: any[];
    viewAllHref?: string;
    viewAllText?: string;
    loading?: boolean;
    className?: string; // Allow custom classes like 'bg-white' if needed override
    columns?: number;
}

export function ProductSection({
    title,
    subtitle,
    products,
    viewAllHref,
    viewAllText,
    loading = false,
    className = "section-padding product-listing-bg",
    columns
}: ProductSectionProps) {
    const { t } = useLanguage();

    // Default translations if not provided
    const linkText = viewAllText || (t && t("viewAll")) || "View all";

    if (loading) {
        return (
            <section className={className}>
                <div className="section-container">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex flex-col gap-2">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className={className}>
            <div className="section-container">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex flex-col">
                        {subtitle && <span className="text-section-title block mb-3">{subtitle}</span>}
                        <h2 className="h2 text-foreground">{title}</h2>
                    </div>
                    {viewAllHref && (
                        <Link
                            href={viewAllHref}
                            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                        >
                            {linkText} <ArrowRight className="w-5 h-5" />
                        </Link>
                    )}
                </div>
                <ProductGrid products={products} columns={columns} />
            </div>
        </section>
    );
}
