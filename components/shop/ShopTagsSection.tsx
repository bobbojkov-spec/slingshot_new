"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ShopTagsSectionProps {
    title: string;
    keywords: any[];
    getKeywordHref: (keyword: any) => string;
}

export function ShopTagsSection({ title, keywords, getKeywordHref }: ShopTagsSectionProps) {
    const { language } = useLanguage();

    return (
        <section className="relative py-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 overflow-hidden"
            style={{
                marginLeft: 'calc(-50vw + 50%)',
                marginRight: 'calc(-50vw + 50%)',
                width: '100vw',
            }}
        >
            {/* Dark slate background */}
            <div className="absolute inset-0 -z-10"
                style={{
                    background: 'linear-gradient(135deg, hsl(215 25% 18%) 0%, hsl(220 30% 12%) 50%, hsl(215 35% 10%) 100%)',
                }}
            />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 -z-[9] opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                }}
            />

            {/* Orange/blue accent orbs */}
            <div className="absolute -z-[5] w-[300px] h-[300px] rounded-full blur-3xl opacity-30"
                style={{
                    top: '-100px',
                    left: '5%',
                    background: 'radial-gradient(circle, hsl(29 100% 50% / 0.4) 0%, transparent 70%)',
                }}
            />
            <div className="absolute -z-[5] w-[250px] h-[250px] rounded-full blur-3xl opacity-20"
                style={{
                    bottom: '-80px',
                    right: '10%',
                    background: 'radial-gradient(circle, hsl(210 60% 50% / 0.3) 0%, transparent 70%)',
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <h3 className="text-lg md:text-xl font-display font-bold text-white/90 mb-6 tracking-wide uppercase">
                    {title}
                </h3>
                <div className="flex flex-wrap gap-3">
                    {keywords.map((keyword) => {
                        const label = language === 'bg' ? keyword.name_bg : keyword.name_en;
                        return (
                            <Link
                                key={keyword.slug}
                                href={getKeywordHref(keyword)}
                                className="px-5 py-2.5 rounded-full bg-white text-sm font-semibold text-deep-navy shadow-md hover:shadow-xl hover:bg-accent hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out border border-white/60"
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
