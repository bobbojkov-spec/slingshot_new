'use client';

import React from 'react';
import BackgroundVideoPlayer from '@/components/ui/BackgroundVideoPlayer';
import { useBackgroundParallax } from '@/hooks/useParallax';

import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface CollectionHeroProps {
    title: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
    breadcrumbs?: BreadcrumbItem[];
}

export const CollectionHero: React.FC<CollectionHeroProps> = ({
    title,
    subtitle,
    imageUrl,
    videoUrl,
    breadcrumbs
}) => {
    const { containerRef, imageStyle } = useBackgroundParallax(0.35);
    const [imageError, setImageError] = React.useState(false);

    const BreadcrumbsContainer = () => {
        if (!breadcrumbs || breadcrumbs.length === 0) return null;
        return (
            <div className="absolute bottom-0 left-0 bg-white z-30 px-8 py-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && <span>/</span>}
                        {item.href ? (
                            <Link href={item.href} className="hover:text-black transition-colors text-black/60">
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-black font-bold">{item.label}</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // Video Hero (YouTube or Direct)
    if (videoUrl) {
        return (
            <div className="hero-media hero-shadow relative w-full overflow-hidden bg-black">
                <BackgroundVideoPlayer
                    videoUrl={videoUrl}
                    poster={imageUrl}
                />
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="relative z-20 h-full flex items-center">
                    <div className="section-container text-white">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-hero font-bold uppercase tracking-tighter mb-6">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-xl md:text-2xl text-white/90 font-body font-medium max-w-2xl leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <BreadcrumbsContainer />
            </div>
        );
    }

    // Image Hero with Parallax
    if (imageUrl && !imageError) {
        return (
            <div ref={containerRef} className="hero-media hero-shadow relative w-full overflow-hidden">
                <img
                    src={imageUrl}
                    alt={`${title} Collection - Slingshot Bulgaria`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    loading="eager"
                    style={{ ...imageStyle, aspectRatio: '16/9' }}
                />
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="relative z-20 h-full flex items-center">
                    <div className="section-container text-white">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-hero font-bold uppercase tracking-tighter mb-6">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-xl md:text-2xl text-white/90 font-body font-medium max-w-2xl leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <BreadcrumbsContainer />
            </div>
        );
    }

    // Minimal Header (No Media)
    return (
        <div className="relative hero-shadow bg-deep-navy pt-32 pb-16">
            <div className="section-container">
                <div className="max-w-4xl">
                    <h1 className="text-3xl md:text-4xl font-hero font-bold text-white mb-6 uppercase tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-lg md:text-xl text-white/70 max-w-2xl font-body">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <BreadcrumbsContainer />
        </div>
    );
};
