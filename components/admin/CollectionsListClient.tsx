'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import CollectionCard from './CollectionCard';

type Collection = {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    image_url?: string | null;
    source: string;
    product_count?: number;
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

    const filteredCollections = collections.filter(c => {
        const searchLower = searchTerm.toLowerCase();
        return (
            c.title.toLowerCase().includes(searchLower) ||
            c.slug.toLowerCase().includes(searchLower) ||
            (c.subtitle && c.subtitle.toLowerCase().includes(searchLower))
        );
    });

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
            {/* Search Bar */}
            <div className="mb-8 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter collections by title or slug..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">
                    Showing {filteredCollections.length} of {collections.length} collections
                </p>
            </div>

            {/* Grid */}
            {filteredCollections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCollections.map((collection) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
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
