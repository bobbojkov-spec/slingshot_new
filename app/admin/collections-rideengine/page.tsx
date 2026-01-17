import CollectionsListClient from '@/components/admin/CollectionsListClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { query } from '@/lib/dbPg';
import { getPresignedUrl } from '@/lib/railway/storage';

export const dynamic = 'force-dynamic';

interface Collection {
    id: string;
    slug: string;
    image_url: string | null;
    source: string;
    title: string;
    subtitle?: string | null;
}

async function getCollectionsBySource(source: string): Promise<Collection[]> {
    const result = await query(
        `SELECT 
      c.id,
      c.slug,
      c.image_url,
      c.source,
      COALESCE(ct.title, c.title) as title,
      ct.subtitle,
      (SELECT COUNT(*)::int FROM collection_products cp WHERE cp.collection_id = c.id) as product_count
    FROM collections c
    LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = 'en'
    WHERE c.source = $1 AND c.visible = true
    ORDER BY c.sort_order ASC, ct.title ASC`,
        [source]
    );

    // Sign URLs
    const collectionsWithSignedUrls = await Promise.all(result.rows.map(async (c: any) => {
        let signedUrl = c.image_url;

        // Only sign if it's not a full URL OR if it's a known internal bucket path
        if (c.image_url &&
            (!c.image_url.startsWith('http') || c.image_url.includes('slingshot-images-dev') || c.image_url.includes('slingshot-raw'))
        ) {
            try {
                const path = c.image_url.startsWith('http') ? new URL(c.image_url).pathname.substring(1) : c.image_url;
                signedUrl = await getPresignedUrl(path);
            } catch (error) {
                console.error(`Failed to sign URL for ${c.slug}:`, error);
            }
        }
        return {
            ...c,
            image_url: signedUrl
        };
    }));

    return collectionsWithSignedUrls as Collection[];
}

export default async function RideEngineCollectionsPage() {
    const collections = await getCollectionsBySource('rideengine');

    const sourceTitle = 'Ride Engine';
    const sourceColor = '#000000'; // Ride Engine brand color

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            {sourceTitle} Collections
                            <span
                                className="text-sm font-normal px-3 py-1 rounded-full text-white"
                                style={{ backgroundColor: sourceColor }}
                            >
                                {collections.length} collections
                            </span>
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Manage Ride Engine collection hero images, titles, and subtitles
                        </p>
                    </div>
                    <Link
                        href="/admin/collections-rideengine/groups"
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <span>Manage Menu Groups</span>
                        <ArrowLeft className="rotate-180" size={16} />
                    </Link>
                </div>
            </div>

            <CollectionsListClient
                initialCollections={collections}
                sourceTitle={sourceTitle}
                sourceColor={sourceColor}
            />
        </div>
    );
}
