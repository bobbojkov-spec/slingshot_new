import { query } from '@/lib/dbPg';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CollectionEditForm from '@/components/admin/CollectionEditForm';
import { getPresignedUrl } from '@/lib/railway/storage';

type PageProps = {
    params: Promise<{ slug: string }>;
};

async function getCollection(slug: string) {
    // Get collection data
    const collectionResult = await query(
        `SELECT id, source, slug, image_url, video_url, visible, sort_order
     FROM collections
     WHERE source = 'slingshot' AND slug = $1`,
        [slug]
    );

    if (collectionResult.rows.length === 0) {
        return null;
    }

    const collection = collectionResult.rows[0];

    // Sign the image URL if it's a relative path
    let signedImageUrl = collection.image_url;
    if (collection.image_url && !collection.image_url.startsWith('http') && !collection.image_url.startsWith('/')) {
        signedImageUrl = await getPresignedUrl(collection.image_url);
    }

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

    return {
        collection: {
            ...collection,
            signed_image_url: signedImageUrl
        },
        translations
    };
}

export default async function SlingshotCollectionEditPage({ params }: PageProps) {
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
                    href="/admin/collections-slingshot"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Slingshot Collections
                </Link>
            </div>

            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {translations.en.title || 'Untitled Collection'}
                    </h1>
                    <span className="px-4 py-2 text-sm font-medium rounded-full bg-orange-100 text-orange-700">
                        Slingshot
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
