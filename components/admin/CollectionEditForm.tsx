'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductSelector from '@/components/admin/ProductSelector';

type CollectionEditFormProps = {
    collection: {
        id: string;
        source: string;
        slug: string;
        image_url: string | null;
        video_url: string | null;
        signed_image_url?: string | null;
        visible: boolean;
        sort_order: number;
    };
    translations: {
        en: { title: string; subtitle: string | null };
        bg: { title: string; subtitle: string | null };
    };
};

export default function CollectionEditForm({
    collection,
    translations: initialTranslations
}: CollectionEditFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [productCount, setProductCount] = useState<number>(0);
    const [products, setProducts] = useState<any[]>([]);

    const [imageUrl, setImageUrl] = useState(collection.image_url || '');
    const [videoUrl, setVideoUrl] = useState(collection.video_url || '');
    const [visible, setVisible] = useState(collection.visible);
    const [sortOrder, setSortOrder] = useState(collection.sort_order);
    const [slug, setSlug] = useState(collection.slug);

    const [translations, setTranslations] = useState(initialTranslations);

    // Fetch products
    useEffect(() => {
        fetch(`/api/admin/collections/${collection.id}/products`)
            .then(r => r.json())
            .then(data => {
                const prods = data.products || [];
                setProducts(prods);
                setProductCount(prods.length);
            })
            .catch(console.error);
    }, [collection.id]);

    const updateTranslation = (lang: 'en' | 'bg', field: 'title' | 'subtitle', value: string) => {
        setTranslations(prev => ({
            ...prev,
            [lang]: {
                ...prev[lang],
                [field]: value
            }
        }));
    };

    const [uploading, setUploading] = useState(false);
    const [displayUrl, setDisplayUrl] = useState(collection.signed_image_url || collection.image_url || '');
    const [imageError, setImageError] = useState(false);

    // Reset error when URL changes
    useEffect(() => {
        setImageError(false);
    }, [displayUrl]);

    // Fetch signed URL if the imageUrl changes manually
    useEffect(() => {
        if (!imageUrl) {
            setDisplayUrl('');
            return;
        }

        // Only need to fetch if it's a relative path and doesn't match current displayUrl
        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            const timer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/admin/sign-url?path=${encodeURIComponent(imageUrl)}`);
                    if (res.ok) {
                        const { url } = await res.json();
                        setDisplayUrl(url);
                    }
                } catch (err) {
                    console.error('Failed to sign manual URL', err);
                }
            }, 500); // 500ms debounce
            return () => clearTimeout(timer);
        } else {
            // It's already a full URL
            setDisplayUrl(imageUrl);
        }
    }, [imageUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('collectionId', collection.id);

        try {
            const response = await fetch('/api/admin/collections/hero/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();

            // Store the RELATIVE PATH for the database
            const relativePath = data.paths.full || data.paths.middle || data.paths.thumb;
            setImageUrl(relativePath);

            // Store the SIGNED URL for immediate display
            const signedUrl = data.urls.full || data.urls.middle || data.urls.thumb;
            setDisplayUrl(signedUrl);

        } catch (err: any) {
            setError(err.message);
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            // Reset the input so the same file can be selected again
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/collections/${collection.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    image_url: imageUrl,
                    video_url: videoUrl,
                    visible,
                    sort_order: sortOrder,
                    translations
                })
            });

            if (!response.ok) {
                const text = await response.text();
                let errorMsg = 'Failed to save collection';
                try {
                    const json = JSON.parse(text);
                    if (json.error) errorMsg = json.error;
                } catch {
                    if (text) errorMsg = text.slice(0, 100);
                }
                throw new Error(errorMsg);
            }

            // Refresh the page to show updated data
            router.refresh();

            // Show success message
            alert('Collection saved successfully!');

        } catch (err: any) {
            setError(err.message);
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl pb-20">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Hero Image Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    Hero Presentation
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Optimized Variants</span>
                </h2>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Left: Image Preview (300px) */}
                        <div className="w-full md:w-[320px] flex-shrink-0">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Desktop Preview (1900px)</label>
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group">
                                {displayUrl && !imageError ? (
                                    <>
                                        <img
                                            src={displayUrl}
                                            alt="Collection hero"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={() => setImageError(true)}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-xs font-medium">Hero Image Preview</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-gradient-to-br from-gray-50 to-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{imageError && displayUrl ? 'Image Error' : 'No hero image'}</span>
                                    </div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                        <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                        <span className="text-sm font-semibold text-gray-900">Processing Variants...</span>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">300 • 1000 • 1900</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Upload Button & URL Input */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Upload Media</label>
                                <label className="relative inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50 group overflow-hidden">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                    <div className="flex items-center gap-2">
                                        {uploading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        )}
                                        {uploading ? 'Processing...' : 'Upload Hero Image'}
                                    </div>
                                </label>
                                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                                    Upload a high-resolution image. We will automatically generate <br />
                                    <b>300px</b>, <b>1000px</b>, and <b>1900px</b> variants for optimal performance.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Image URL (Manual Override)
                                </label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://storage.railway.app/..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Video URL (YouTube or MP4)
                                </label>
                                <input
                                    type="url"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=... or .mp4"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section - Both Languages Visible */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* English */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <span className="text-lg">🇬🇧</span> English
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={translations.en.title}
                                        onChange={(e) => updateTranslation('en', 'title', e.target.value)}
                                        placeholder="Collection title"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subtitle
                                    </label>
                                    <textarea
                                        value={translations.en.subtitle || ''}
                                        onChange={(e) => updateTranslation('en', 'subtitle', e.target.value)}
                                        placeholder="Collection subtitle"
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bulgarian */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <span className="text-lg">🇧🇬</span> Bulgarian
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Заглавие
                                    </label>
                                    <input
                                        type="text"
                                        value={translations.bg.title}
                                        onChange={(e) => updateTranslation('bg', 'title', e.target.value)}
                                        placeholder="Заглавие на колекцията"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Подзаглавие
                                    </label>
                                    <textarea
                                        value={translations.bg.subtitle || ''}
                                        onChange={(e) => updateTranslation('bg', 'subtitle', e.target.value)}
                                        placeholder="Подзаглавие"
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Products ({productCount})
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex gap-6">
                        {/* Left: Product List */}
                        <div className="flex-1">
                            {productCount > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50"
                                        >
                                            <div className="w-[70px] h-[70px] bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                                                {product.thumbnail_url ? (
                                                    <img
                                                        src={product.thumbnail_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-center text-gray-600 line-clamp-2 w-full" title={product.name}>
                                                {product.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No products in this collection</p>
                            )}
                        </div>

                        {/* Right: Manage Button */}
                        <div className="flex items-start">
                            <button
                                onClick={() => setShowProductSelector(true)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                                Manage Products
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Visible
                            </label>
                            <p className="text-sm text-gray-500">
                                Show this collection on the public website
                            </p>
                        </div>
                        <button
                            onClick={() => setVisible(!visible)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${visible ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${visible ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Slug (URL Handle)
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            Unique ID used in the URL. Must be unique across all collections.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort Order
                        </label>
                        <input
                            type="number"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            Lower numbers appear first (0 is first)
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
            </div>

            {/* Product Selector Modal */}
            {showProductSelector && (
                <ProductSelector
                    collectionId={collection.id}
                    onClose={() => setShowProductSelector(false)}
                    onSave={() => {
                        // Refresh products and count
                        fetch(`/api/admin/collections/${collection.id}/products`)
                            .then(r => r.json())
                            .then(data => {
                                const prods = data.products || [];
                                setProducts(prods);
                                setProductCount(prods.length);
                            })
                            .catch(console.error);
                    }}
                />
            )}
        </div>
    );
}
