"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Layers } from "lucide-react";

interface Collection {
    id: string;
    title: string;
    subtitle?: string;
    slug: string;
    source: string;
    image_url: string | null;
}

export default function ShopByCategories() {
    const { t, language } = useLanguage();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCollections() {
            try {
                const res = await fetch(`/api/homepage-collections?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    setCollections(data.collections || []);
                }
            } catch (error) {
                console.error("Error fetching homepage collections:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCollections();
    }, [language]);

    if (loading) {
        return (
            <section className="section-padding bg-background">
                <div className="section-container">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-[4/3] bg-gray-200 rounded animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (collections.length === 0) {
        return null;
    }

    return (
        <section className="section-padding bg-background">
            <div className="section-container">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="text-section-title block mb-4">
                        {t("shopByCategories.browseLabel")}
                    </span>
                    <h2 className="h2 text-foreground">{t("shopByCategories.title")}</h2>
                </div>

                {/* Collections Grid - Desktop: 4x3 (12 items), Mobile: 2x6 (12 items) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {collections.slice(0, 12).map((collection, index) => (
                        <Link
                            key={collection.id}
                            href={`/collections/${collection.slug}`}
                            className="group relative aspect-[4/3] overflow-hidden rounded bg-gray-100 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Background Image */}
                            {collection.image_url ? (
                                <img
                                    src={collection.image_url}
                                    alt={`${collection.title} Collection`}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                    <Layers className="w-10 h-10" />
                                </div>
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-5">
                                <h3 className="h3 font-bold text-white uppercase tracking-tighter mb-2 transition-colors">
                                    {collection.title}
                                </h3>
                                {collection.subtitle && (
                                    <p className="text-xs text-gray-300 line-clamp-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                        {collection.subtitle}
                                    </p>
                                )}
                            </div>

                            {/* Source Badge */}
                            <div className="absolute top-3 right-3">
                                <span className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] font-medium text-white uppercase tracking-wide">
                                    {collection.source}
                                </span>
                            </div>

                            {/* Hover Border Effect */}
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent rounded transition-colors duration-300" />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
