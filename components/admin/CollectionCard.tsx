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
    onDelete
}: {
    collection: Collection;
    onDelete?: () => void;
}) {
    // The directory names match the source values exactly: 'slingshot', 'rideengine', 'homepage'
    const source = collection.source;

    return (
        <div className="relative group">
            <Link
                href={`/admin/collections-${source}/${collection.slug}`}
                className="block relative aspect-[2/1] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-100"
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
                    <h3 className="text-white font-semibold text-lg line-clamp-2 mb-1">
                        {collection.title}
                    </h3>
                    {collection.subtitle && (
                        <p className="text-white/80 text-sm line-clamp-2">
                            {collection.subtitle}
                        </p>
                    )}
                    {/* Product Count Badge */}
                    <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded border border-white/20">
                        {collection.product_count ?? 0}
                    </div>
                </div>

                {/* Translation Tooltip (Floating Mini Window) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 p-4">
                    <div className="bg-black/80 backdrop-blur-md rounded-lg p-3 text-xs text-white shadow-xl max-w-full w-full space-y-2 border border-white/10">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">English</span>
                            <p className="font-semibold truncate">{collection.title_en || '-'}</p>
                            {collection.subtitle_en && <p className="text-gray-300 truncate text-[10px]">{collection.subtitle_en}</p>}
                        </div>
                        <div className="border-t border-white/10 pt-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Bulgarian</span>
                            <p className="font-semibold truncate">{collection.title_bg || '-'}</p>
                            {collection.subtitle_bg && <p className="text-gray-300 truncate text-[10px]">{collection.subtitle_bg}</p>}
                        </div>
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
                    className="absolute top-2 left-2 z-20 bg-red-600 text-white p-1.5 rounded-full opacity-100 hover:bg-red-700 transition-colors shadow-lg"
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
