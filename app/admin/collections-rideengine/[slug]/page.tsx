import { query } from '@/lib/dbPg';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CollectionEditForm from '@/components/admin/CollectionEditForm';

type PageProps = {
    params: Promise<{ slug: string }>;
};

async function getCollection(slug: string) {
    // Get collection data
    const collectionResult = await query(
        `SELECT id, source, slug, image_url, video_url, visible, sort_order
     FROM collections
     WHERE source = 'rideengine' AND slug = $1`,
        [slug]
    );

    if (collectionResult.rows.length === 0) {
        return null;
    }

    const collection = collectionResult.rows[0];

    // Get translations
    const translationsResult = await query(
        `SELECT language_code, title, subtitle
     FROM collection_translations
     WHERE collection_id = $1`,
        [collection.id]
    );

    const translations = {
        en: translationsResult.rows.find(t => t.language_code === 'en') || { title: '', subtitle: null },
        bg: translationsResult.rows.find(t => t.language_code === 'bg') || { title: '', subtitle: null }
    };

    return { collection, translations };
}

export default async function RideEngineCollectionEditPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await getCollection(slug);

    if (!data) {
        notFound();
    }

    const { collection, translations } = data;

    return (
        <div className="p-8">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link
                    href="/admin/collections-rideengine"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Ride Engine Collections
                </Link>
            </div>

            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {translations.en.title || 'Untitled Collection'}
                    </h1>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">
                        Ride Engine
                    </span>
                </div>
                <p className="text-gray-600">
                    Edit collection hero image, title, and subtitle in multiple languages
                </p>
            </div>

            {/* Edit Form */}
            <CollectionEditForm
                collection={collection}
                translations={translations}
            />
        </div>
    );
}
