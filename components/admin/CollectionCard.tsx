'use client';

import Image from 'next/image';
import Link from 'next/link';

type Collection = {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    image_url?: string | null;
    source: string;
    product_count?: number;
    title_en?: string;
    subtitle_en?: string | null;
    title_bg?: string;
    subtitle_bg?: string | null;
};

export default function CollectionCard({
    collection,
    viewLang = 'en',
    onDelete
}: {
    collection: Collection;
    viewLang?: 'en' | 'bg';
    onDelete?: () => void;
}) {
    // The directory names match the source values exactly: 'slingshot', 'rideengine', 'homepage'
    const source = collection.source;

    // User said: "flip the switch, see the titles"
    // Let's fallback to EN but maybe indicate it's a fallback? 
    // Or better: If viewLang is BG, show title_bg. If title_bg is empty, show title_en (or "No BG Title").

    let displayTitle = viewLang === 'bg' ? (collection.title_bg || collection.title) : (collection.title_en || collection.title);
    let displaySubtitle = viewLang === 'bg' ? collection.subtitle_bg : collection.subtitle_en;

    // If we are in BG mode and there IS no specific BG title, maybe we should visually indicate it?
    // CollectionCard implementation logic...
    const isFallback = viewLang === 'bg' && !collection.title_bg;

    return (
        <div className="relative group">
            <Link
                href={`/admin/collections-${source}/${collection.slug}`}
                className="block relative aspect-[2/1] rounded overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-100"
            >
                {/* Background Image / Placeholder */}
                <div className="absolute inset-0">
                    {collection.image_url ? (
                        <Image
                            src={collection.image_url}
                            alt={collection.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized={collection.image_url.startsWith('http')}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-4 z-10">
                    <h3 className={`font-medium text-lg line-clamp-2 mb-2 ${isFallback ? 'text-orange-200 italic' : 'text-white'}`}>
                        {displayTitle}
                    </h3>
                    {displaySubtitle && (
                        <p className="text-white/80 text-sm line-clamp-2">
                            {displaySubtitle}
                        </p>
                    )}
                    {/* Product Count Badge */}
                    <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-4 py-0.5 rounded border border-white/20">
                        {collection.product_count ?? 0}
                    </div>
                </div>

                {/* Hover Icon (Edit) */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                        className="w-6 h-6 text-white drop-shadow-lg"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                </div>
            </Link>

            {/* Delete Button (Outside Link, Top Left or Top Right shifted?) */}
            {/* User said "ZERO product should be deletaable ( inside a delete button) oly if zero !" */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-2 left-2 z-20 bg-red-600 text-white p-2.5 rounded-full opacity-100 hover:bg-red-700 transition-colors shadow-lg"
                    title="Delete Empty Collection"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
        </div>
    );
}
