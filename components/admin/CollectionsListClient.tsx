'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import CollectionCard from './CollectionCard';
import AddCollectionModal from './AddCollectionModal';

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

type CollectionsListClientProps = {
    initialCollections: Collection[];
    sourceTitle: string;
    sourceColor: string;
};

export default function CollectionsListClient({
    initialCollections,
    sourceTitle,
    sourceColor
}: CollectionsListClientProps) {
    const [collections, setCollections] = useState(initialCollections);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewLang, setViewLang] = useState<'en' | 'bg'>('en');

    const filteredCollections = collections.filter(c => {
        const searchLower = searchTerm.toLowerCase();
        // Search in both languages just in case, or just the active one?
        // Let's search in all relevant fields
        return (
            c.title.toLowerCase().includes(searchLower) ||
            c.slug.toLowerCase().includes(searchLower) ||
            (c.subtitle && c.subtitle.toLowerCase().includes(searchLower)) ||
            (c.title_bg && c.title_bg.toLowerCase().includes(searchLower)) ||
            (c.title_en && c.title_en.toLowerCase().includes(searchLower))
        );
    });

    const handleAddSuccess = (newCollection: Collection) => {
        // Add new collection to state and re-sort if necessary (or just prepend)
        setCollections(prev => [...prev, newCollection]);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this collection?')) return;
        try {
            const res = await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to delete');
                return;
            }
            setCollections(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            console.error(e);
            alert('Error deleting collection');
        }
    };

    return (
        <div>
            {/* Search Bar & Controls */}
            <div className="mb-8 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                <div className="relative max-w-xl w-full flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter collections..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                        <p className="text-xs text-gray-500 mt-2 ml-1 absolute">
                            Showing {filteredCollections.length} of {collections.length} collections
                        </p>
                    </div>

                    {/* Language Switcher */}
                    <div className="bg-white border border-gray-200 rounded-lg p-1 flex items-center shadow-sm">
                        <button
                            onClick={() => setViewLang('en')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewLang === 'en'
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setViewLang('bg')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewLang === 'bg'
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            BG
                        </button>
                    </div>
                </div>

                <AddCollectionModal
                    source={sourceTitle.toLowerCase().replace(' ', '')}
                    onSuccess={handleAddSuccess}
                />
            </div>
            <div className="h-6"></div> {/* Spacer for the absolute positioned count text */}

            {/* Grid */}
            {filteredCollections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCollections.map((collection) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                            viewLang={viewLang}
                            onDelete={collection.product_count === 0 ? () => handleDelete(collection.id) : undefined}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="text-gray-400 mb-4">
                        <Search className="w-12 h-12 mx-auto opacity-20" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No collections match your search
                    </h3>
                    <p className="text-gray-500">
                        Try a different keyword
                    </p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-blue-600 font-medium hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            )}
        </div>
    );
}
