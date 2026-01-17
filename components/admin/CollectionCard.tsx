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
};

export default function CollectionCard({ collection }: { collection: Collection }) {
    const source = collection.source === 'slingshot' ? 'slingshot' : 'rideengine';

    return (
        <Link
            href={`/admin/collections-${source}/${collection.slug}`}
            className="group block relative aspect-[2/1] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-100"
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
            </div>

            {/* Hover Icon */}
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
    );
}
