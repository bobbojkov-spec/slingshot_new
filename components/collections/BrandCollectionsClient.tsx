'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { CollectionHero } from './CollectionHero';
import { FloatingWarning } from '@/components/FloatingWarning';
import { Collection } from '@/services/collections';
import Link from 'next/link';
import { Layers, ArrowRight } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BrandCollectionsClientProps {
    collections: Collection[];
    heroData: {
        title: string;
        subtitle?: string;
        imageUrl?: string | null;
        videoUrl?: string | null;
    };
    breadcrumbs?: BreadcrumbItem[];
    brandColor?: string;
}

// 3D Parallax Collection Card Component
interface CollectionCardProps {
    collection: Collection;
    index: number;
}

function CollectionCard({ collection, index }: CollectionCardProps) {
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

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

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
            className="collection-3d-card stagger-load block"
            style={{
                animationDelay: `${index * 60}ms`,
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
                    alt={`${collection.title} Collection - Slingshot Bulgaria`}
                    className="collection-card-image"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                    <Layers className="w-12 h-12 text-white/20" />
                </div>
            )}

            {/* Cinematic Overlay */}
            <div className="collection-cinematic-overlay" />

            {/* Shine Sweep Effect */}
            <div
                className="collection-shine"
                style={{ animationDelay: isHovered ? "0s" : "-1s" }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-5 z-10">
                {/* Title with Underline */}
                <div className="mb-2">
                    <h3 className="collection-card-title text-white text-lg lg:text-xl mb-2">
                        <span className="collection-underline">
                            {collection.title}
                        </span>
                    </h3>

                    {/* Subtitle - Always visible */}
                    {collection.subtitle && (
                        <p className="text-xs lg:text-sm text-white/70 font-body line-clamp-2 mb-3">
                            {collection.subtitle}
                        </p>
                    )}
                </div>

                {/* Arrow Reveal */}
                <div className="collection-arrow text-signal-orange font-display text-xs uppercase tracking-wider font-semibold">
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3" />
                </div>
            </div>

            {/* Hover Border Glow */}
            <div
                className="absolute inset-0 rounded-lg border-2 border-transparent transition-all duration-300 pointer-events-none"
                style={{
                    borderColor: isHovered ? "hsla(29, 100%, 50%, 0.5)" : "transparent",
                    boxShadow: isHovered ? "0 0 25px hsla(29, 100%, 50%, 0.2), inset 0 0 25px hsla(29, 100%, 50%, 0.05)" : "none"
                }}
            />
        </Link>
    );
}

export function BrandCollectionsClient({ collections, heroData, breadcrumbs, brandColor }: BrandCollectionsClientProps) {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <CollectionHero
                title={heroData.title}
                subtitle={heroData.subtitle}
                imageUrl={heroData.imageUrl || null}
                videoUrl={heroData.videoUrl || null}
                breadcrumbs={breadcrumbs}
            />

            {/* Collections Grid Section */}
            <div ref={sectionRef} className="collections-section py-16 lg:py-24">
                {/* Background Effects */}
                <div className="categories-grid-pattern" />
                <div className="categories-noise" />

                {/* Glowing Orbs */}
                <div
                    className="categories-glow-orb"
                    style={{
                        top: "5%",
                        left: "-5%",
                        animationDelay: "0s"
                    }}
                />
                <div
                    className="categories-glow-orb"
                    style={{
                        bottom: "10%",
                        right: "-10%",
                        animationDelay: "2s",
                        background: "radial-gradient(circle, hsla(207 67% 17% / 0.3) 0%, transparent 70%)"
                    }}
                />

                {/* Content Container */}
                <div className="section-container relative z-10">
                    {/* Section Header */}
                    <div
                        className={`text-center mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            }`}
                    >
                        <span className="categories-section-subtitle text-signal-orange block mb-4">
                            Browse All Collections
                        </span>
                        <h2 className="categories-section-title text-3xl md:text-4xl lg:text-5xl">
                            Explore The Gear
                        </h2>

                        {/* Decorative Line */}
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <div className="w-16 h-px bg-gradient-to-r from-transparent to-signal-orange/50" />
                            <div className="w-2 h-2 rounded-full bg-signal-orange" />
                            <div className="w-16 h-px bg-gradient-to-l from-transparent to-signal-orange/50" />
                        </div>
                    </div>

                    {/* Collections Grid - 6 columns on large screens */}
                    {collections.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-5">
                            {collections.map((collection, index) => (
                                <CollectionCard
                                    key={collection.id}
                                    collection={collection}
                                    index={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-xl text-white/60 font-body">No collections found.</p>
                        </div>
                    )}
                </div>
            </div>

            <FloatingWarning />
        </div>
    );
}
