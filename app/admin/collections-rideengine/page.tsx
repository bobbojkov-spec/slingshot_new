import { query } from '@/lib/dbPg';
import { getPresignedUrl } from '@/lib/railway/storage';
import CollectionsListClient from '@/components/admin/CollectionsListClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
      ct.subtitle
    FROM collections c
    LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = 'en'
    WHERE c.source = $1 AND c.visible = true
    ORDER BY c.sort_order ASC, ct.title ASC`,
        [source]
    );

    // Sign URLs
    const collectionsWithSignedUrls = await Promise.all(result.rows.map(async (c: any) => {
        let signedUrl = c.image_url;
        if (c.image_url && !c.image_url.startsWith('http') && !c.image_url.startsWith('/')) {
            try {
                signedUrl = await getPresignedUrl(c.image_url);
            } catch (err) {
                console.error(`Failed to sign URL for collection ${c.slug}`, err);
                signedUrl = null;
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
