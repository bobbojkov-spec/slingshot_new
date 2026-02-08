"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Layers, ArrowRight } from "lucide-react";

interface Collection {
    id: string;
    title: string;
    subtitle?: string;
    slug: string;
    source: string;
    image_url: string | null;
}

interface CategoryCardProps {
    collection: Collection;
    index: number;
}

// 3D Parallax Card Component
function CategoryCard({ collection, index }: CategoryCardProps) {
    const { language } = useLanguage();
    const cardRef = useRef<HTMLAnchorElement>(null);
    const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTransform("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
        setIsHovered(false);
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    return (
        <Link
            ref={cardRef}
            href={`/collections/${collection.slug}`}
            className="category-3d-card stagger-load block"
            style={{
                animationDelay: `${index * 80}ms`,
                transform: transform,
                transformStyle: "preserve-3d",
                perspective: "1000px"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {/* Background Image */}
            {collection.image_url ? (
                <img
                    src={collection.image_url}
                    alt={`${collection.title} Collection`}
                    loading="lazy"
                    className="category-image"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                    <Layers className="w-16 h-16 text-white/20" />
                </div>
            )}

            {/* Cinematic Overlay */}
            <div className="category-cinematic-overlay" />

            {/* Shine Sweep Effect */}
            <div
                className="category-shine"
                style={{ animationDelay: isHovered ? "0s" : "-1s" }}
            />

            {/* Glassmorphism Source Tag */}
            <div className="absolute top-4 right-4 z-10">
                <span className="glassmorphism-tag">
                    {collection.source}
                </span>
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 z-10">
                {/* Title with Underline */}
                <div className="mb-3">
                    <h3 className="category-card-title text-white text-xl lg:text-2xl mb-2">
                        <span className="category-underline">
                            {collection.title}
                        </span>
                    </h3>

                    {/* Subtitle */}
                    {collection.subtitle && (
                        <p className="text-sm text-white/70 font-body line-clamp-2 opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-2 transition-all duration-500 lg:group-hover:opacity-100 lg:group-hover:translate-y-0">
                            {collection.subtitle}
                        </p>
                    )}
                </div>

                {/* Arrow Reveal */}
                <div className="category-arrow text-signal-orange font-body text-sm uppercase tracking-wider font-semibold">
                    <span>{language === "bg" ? "Разгледай" : "Explore"}</span>
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>

            {/* Hover Border Glow */}
            <div
                className="absolute inset-0 rounded-lg border-2 border-transparent transition-all duration-300 pointer-events-none"
                style={{
                    borderColor: isHovered ? "hsla(29, 100%, 50%, 0.5)" : "transparent",
                    boxShadow: isHovered ? "0 0 30px hsla(29, 100%, 50%, 0.2), inset 0 0 30px hsla(29, 100%, 50%, 0.05)" : "none"
                }}
            />
        </Link>
    );
}

export default function ShopByCategories() {
    const { t, language } = useLanguage();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    // Intersection Observer for section visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: "50px" }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

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
            <section ref={sectionRef} className="categories-section py-20 lg:py-28">
                {/* Grid Pattern */}
                <div className="categories-grid-pattern" />

                <div className="section-container relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square bg-white/5 rounded-lg animate-pulse"
                                style={{ animationDelay: `${i * 100}ms` }}
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
        <section ref={sectionRef} className="categories-section py-20 lg:py-28">
            {/* Background Effects */}
            <div className="categories-grid-pattern" />
            <div className="categories-noise" />

            {/* Glowing Orbs */}
            <div
                className="categories-glow-orb"
                style={{
                    top: "10%",
                    left: "-10%",
                    animationDelay: "0s"
                }}
            />
            <div
                className="categories-glow-orb"
                style={{
                    bottom: "20%",
                    right: "-5%",
                    animationDelay: "2s",
                    background: "radial-gradient(circle, hsla(207 67% 17% / 0.3) 0%, transparent 70%)"
                }}
            />

            {/* Content Container */}
            <div className="section-container relative z-10">
                {/* Section Header */}
                <div
                    className={`text-center mb-14 lg:mb-20 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                        }`}
                >
                    <span className="text-sm md:text-base font-hero font-medium uppercase tracking-wider text-signal-orange block mb-3">
                        {t("shopByCategories.browseLabel")}
                    </span>
                    <h2 className="h2 font-hero text-white uppercase">
                        {t("shopByCategories.title")}
                    </h2>

                    {/* Decorative Line */}
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <div className="w-16 h-px bg-gradient-to-r from-transparent to-signal-orange/50" />
                        <div className="w-2 h-2 rounded-full bg-signal-orange" />
                        <div className="w-16 h-px bg-gradient-to-l from-transparent to-signal-orange/50" />
                    </div>
                </div>

                {/* Collections Grid - 4 columns on all screens, square aspect ratio */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {collections.slice(0, 12).map((collection, index) => (
                        <CategoryCard
                            key={collection.id}
                            collection={collection}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
