"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/lib/utils/placeholder-image';
import { useBackgroundParallax } from '@/hooks/useParallax';

interface BlockProps {
    data: any;
}

export const HeroBlock: React.FC<BlockProps> = ({ data }) => {
    const { title, subtitle, description, cta_text, cta_link, background_image } = data;
    const imageUrl = background_image?.media_id ? `/api/media/${background_image.media_id}` : PLACEHOLDER_IMAGE;
    const { containerRef, imageStyle } = useBackgroundParallax(0.35);

    return (
        <section ref={containerRef} className="relative min-h-[60vh] flex items-center overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={title || 'Hero'}
                    className="w-full h-full object-cover"
                    style={imageStyle}
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 section-container">
                <div className="max-w-3xl animate-fade-in-up">
                    {subtitle && (
                        <span className="text-section-title text-accent mb-4 block uppercase tracking-wider">
                            {subtitle}
                        </span>
                    )}
                    <h1 className="h1 text-white mb-6 uppercase leading-tight">
                        {title}
                    </h1>
                    {description && (
                        <div
                            className="text-subhero text-white/90 mb-8 max-w-xl prose prose-invert"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    )}
                    {cta_text && cta_link && (
                        <div className="flex flex-wrap gap-4">
                            <Link href={cta_link} className="btn-primary group">
                                {cta_text}
                                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export const TextBlock: React.FC<BlockProps> = ({ data }) => {
    const { title, content } = data;
    return (
        <section className="py-20 bg-white">
            <div className="section-container">
                {title && <h2 className="h2 mb-10 text-slate-900 uppercase">{title}</h2>}
                <div
                    className="prose prose-lg max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        </section>
    );
};

export const TextImageBlock: React.FC<BlockProps> = ({ data }) => {
    const { title, content, image_id, layout } = data;
    const imageUrl = image_id ? `/api/media/${image_id}` : PLACEHOLDER_IMAGE;
    const isImageRight = layout === 'image_right';

    return (
        <section className="py-20 bg-slate-50 overflow-hidden">
            <div className="section-container">
                <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${isImageRight ? 'lg:flex-row-reverse' : ''}`}>
                    <div className="w-full lg:w-1/2">
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                            <img src={imageUrl} alt={title || 'Image'} className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2">
                        {title && <h2 className="h2 mb-8 text-slate-900 uppercase">{title}</h2>}
                        <div
                            className="prose prose-lg text-slate-700"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export const GalleryBlock: React.FC<BlockProps> = ({ data }) => {
    const { title, images } = data;
    return (
        <section className="section-padding bg-white">
            <div className="section-container">
                {title && <h2 className="h2 text-center mb-12">{title}</h2>}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images?.map((img: any, idx: number) => (
                        <div key={idx} className="aspect-square overflow-hidden rounded-lg">
                            <img
                                src={img.media_id ? `/api/media/${img.media_id}` : PLACEHOLDER_IMAGE}
                                alt={img.alt || `Gallery image ${idx + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export const YoutubeBlock: React.FC<BlockProps> = ({ data }) => {
    const { title, video_id } = data;
    return (
        <section className="section-padding bg-gray-50">
            <div className="section-container">
                {title && <h2 className="h2 text-center mb-8">{title}</h2>}
                {video_id && (
                    <div className="aspect-video max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
                        <iframe
                            src={`https://www.youtube.com/embed/${video_id}`}
                            title={title || 'YouTube video'}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export const FeaturedProductsBlock: React.FC<BlockProps> = ({ data }) => {
    const { title, products } = data;
    return (
        <section className="section-padding bg-white">
            <div className="section-container">
                {title && <h2 className="h2 text-center mb-12">{title}</h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products?.map((product: any, idx: number) => (
                        <Link
                            key={idx}
                            href={`/product/${product.slug}`}
                            className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-square overflow-hidden bg-gray-100">
                                <img
                                    src={product.image || PLACEHOLDER_IMAGE}
                                    alt={product.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {product.title}
                                </h3>
                                {product.price && (
                                    <p className="text-accent mt-1">€{Math.round(Number(product.price) || 0).toLocaleString('de-DE')}</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

