'use client';

import Link from 'next/link';
import React from 'react';
import { useBackgroundParallax } from '@/hooks/useParallax';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface ShopHeroProps {
    title: string;
    breadcrumbs?: BreadcrumbItem[];
    variant?: 'default' | 'minimal';
    backgroundImage?: string;
}

export function ShopHero({ title, breadcrumbs, variant = 'default', backgroundImage }: ShopHeroProps) {
    const { containerRef, imageStyle } = useBackgroundParallax(0.3);
    const BreadcrumbsContainer = () => {
        if (!breadcrumbs || breadcrumbs.length === 0) return null;
        return (
            <div className="absolute bottom-0 left-0 bg-zinc-100 z-30 px-8 py-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-500">
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

    if (variant === 'minimal') {
        return (
            <div className="relative bg-primary pt-16 pb-16">
                <div className="section-container">
                    <div className="max-w-4xl">
                        <h1 className="h1 font-logo font-bold text-white mb-6 uppercase tracking-tight">
                            Shop / <span className="text-accent">{title}</span>
                        </h1>
                    </div>
                </div>
                <BreadcrumbsContainer />
            </div>
        );
    }

    const heroImage = backgroundImage || '/hero/slingshot-hero-lifestyle.jpg';

    return (
        <div ref={containerRef} className="shop-hero relative w-full bg-primary flex items-center justify-center overflow-hidden mb-0">
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={heroImage}
                    alt={`${title} - Slingshot Bulgaria Shop Category`}
                    className="w-full h-full object-cover opacity-60"
                    style={imageStyle}
                />
            </div>
            <div className="absolute inset-0 bg-primary/40" />

            <div className="relative z-10 text-center text-white px-4 section-container">
                <h1 className="h1 font-bold uppercase tracking-tighter mb-4 shadow-sm">
                    Shop / <span className="text-accent">{title}</span>
                </h1>
            </div>

            <BreadcrumbsContainer />
        </div>
    );
}
