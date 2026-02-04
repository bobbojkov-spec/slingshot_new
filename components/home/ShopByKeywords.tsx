"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Keyword {
    name_en: string;
    name_bg: string;
    slug: string;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function ShopByKeywords() {
    const { t, language } = useLanguage();
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchKeywords() {
            try {
                const res = await fetch(`/api/homepage-keywords?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    setKeywords(data.keywords || []);
                }
            } catch (error) {
                console.error("Error fetching homepage keywords:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchKeywords();
    }, [language]);

    // Shuffle keywords randomly on each render
    const shuffledKeywords = useMemo(() => {
        if (keywords.length === 0) return [];
        return shuffleArray(keywords);
    }, [keywords]);

    // Limit display: 20 tags max (admin can select up to 20)
    const displayKeywords = shuffledKeywords.slice(0, 20);

    if (loading) {
        return (
            <section className="section-padding bg-ocean-blue">
                <div className="section-container">
                    <div className="flex flex-wrap justify-center gap-4">
                        {[...Array(16)].map((_, i) => (
                            <div
                                key={i}
                                className="h-10 w-24 bg-white/20 rounded-full animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (keywords.length === 0) {
        return null;
    }

    return (
        <section className="section-padding bg-ocean-blue">
            <div className="section-container">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="text-section-title block mb-4 text-white/70">
                        {t("shopByKeywords.browseLabel")}
                    </span>
                    <h2 className="h2 text-white">{t("shopByKeywords.title")}</h2>
                </div>

                {/* Keywords Grid - Desktop: 3 rows of ~7, Mobile: 6 rows */}
                <div className="flex flex-wrap justify-center gap-4 lg:gap-4">
                    {displayKeywords.map((keyword) => {
                        const displayName = language === "bg" && keyword.name_bg
                            ? keyword.name_bg
                            : keyword.name_en;

                        return (
                            <Link
                                key={keyword.slug}
                                href={`/search?tag=${encodeURIComponent(keyword.name_en)}&lang=${language}`}
                                className="group px-4 py-2 bg-white text-deep-navy rounded-full font-medium text-sm 
                  shadow-md hover:shadow-lg hover:bg-accent hover:text-white 
                  transition-all duration-300 inline-flex"
                            >
                                {displayName}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom hint */}
                <p className="text-center text-white/60 text-sm mt-8">
                    {t("shopByKeywords.hint")}
                </p>
            </div>
        </section>
    );
}
