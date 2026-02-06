"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { ArrowRight, Layers } from "lucide-react";

interface CollectionCardProps {
    collection: {
        id: string;
        title: string;
        slug: string;
        image_url: string | null;
    };
    index: number;
    href: string;
}

export function CollectionCard({ collection, index, href }: CollectionCardProps) {
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
            href={href}
            className="collection-3d-card stagger-load block group"
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
                    alt={collection.title}
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
                <h4 className="collection-card-title text-white text-base lg:text-lg leading-tight">
                    <span className="collection-underline">
                        {collection.title}
                    </span>
                </h4>
            </div>

            {/* Arrow - Positioned top-right, appears on hover */}
            <div className="absolute top-3 right-3 z-10 opacity-0 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                <div className="w-7 h-7 rounded-full bg-signal-orange/90 flex items-center justify-center backdrop-blur-sm">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
            </div>

            {/* Hover Border Glow */}
            <div
                className="absolute inset-0 rounded-lg border-2 border-transparent transition-all duration-300 pointer-events-none"
                style={{
                    borderColor: isHovered ? "hsla(29, 100%, 50%, 0.5)" : "transparent",
                    boxShadow: isHovered ? "0 0 20px hsla(29, 100%, 50%, 0.15), inset 0 0 20px hsla(29, 100%, 50%, 0.05)" : "none"
                }}
            />
        </Link>
    );
}

interface ShopCollectionsSectionProps {
    title: string;
    collections: any[];
    getCollectionHref: (collection: any) => string;
}

export function ShopCollectionsSection({ title, collections, getCollectionHref }: ShopCollectionsSectionProps) {
    return (
        <section className="collections-section relative py-12 md:py-16 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 overflow-hidden"
            style={{
                marginLeft: 'calc(-50vw + 50%)',
                marginRight: 'calc(-50vw + 50%)',
                width: '100vw',
            }}
        >
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h3 className="text-lg md:text-xl font-heading font-semibold text-white/90 mb-8 tracking-wide uppercase">
                    {title}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-5">
                    {collections.map((collection, index) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                            index={index}
                            href={getCollectionHref(collection)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
