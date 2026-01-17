'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, GripVertical, Check } from 'lucide-react';

type Collection = {
    id: string;
    title: string;
    slug: string;
    source: string;
};

type MenuGroup = {
    id: string;
    title: string;
    title_bg?: string;
    slug?: string;
    source: string;
    sort_order: number;
    collections?: { id: string; sort_order: number }[];
};

type MenuGroupEditClientProps = {
    group: MenuGroup;
    allCollections: Collection[];
};

export default function MenuGroupEditClient({ group, allCollections }: MenuGroupEditClientProps) {
    const router = useRouter();
    const [title, setTitle] = useState(group.title);
    const [titleBg, setTitleBg] = useState(group.title_bg || '');
    const [slug, setSlug] = useState(group.slug || '');
    const [sortOrder, setSortOrder] = useState(group.sort_order);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);

    // Manage selected collections using a Set for easy toggle
    // However, we strictly want to preserve ORDER.
    // So let's use an array of IDs.
    const [selectedIds, setSelectedIds] = useState<string[]>(
        (group.collections || []).sort((a, b) => a.sort_order - b.sort_order).map(c => c.id)
    );

    const filteredCollections = allCollections.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.includes(searchTerm.toLowerCase())
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/menu-groups/${group.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    title_bg: titleBg,
                    slug,
                    sort_order: sortOrder,
                    collectionIds: selectedIds
                })
            });

            if (!res.ok) throw new Error('Failed to save');
            router.refresh();
            router.push(`/admin/collections-${group.source}/groups`);
        } catch (error) {
            console.error(error);
            alert('Failed to save menu group');
        } finally {
            setSaving(false);
        }
    };

    const toggleCollection = (id: string) => {
        if (selectedIds.includes(id)) {
            // Remove
            setSelectedIds(selectedIds.filter(cid => cid !== id));
        } else {
            // Add to end
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Helper to get collection details by ID
    const getCollection = (id: string) => allCollections.find(c => c.id === id);

    return (
        <div className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Group Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Title (EN)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Title (BG)</label>
                        <input
                            type="text"
                            value={titleBg}
                            onChange={(e) => setTitleBg(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input
                            type="number"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Optional - for linking)</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="e.g. harnesses"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Selected Collections (Reorderable conceptually, but simple list for now) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                        Selected Collections
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{selectedIds.length}</span>
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {selectedIds.map((id, index) => {
                            const col = getCollection(id);
                            if (!col) return null;
                            return (
                                <div key={id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg group">
                                    <span className="text-blue-400 font-mono text-xs w-6">{index + 1}</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">{col.title}</p>
                                        <p className="text-xs text-gray-500">{col.slug}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleCollection(id)}
                                        className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded transition-colors"
                                    >
                                        <ArrowLeft className="rotate-180" size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        {selectedIds.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 italic text-sm">
                                No collections selected.<br />
                                Choose from the list on the right.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: All Collections Picker */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Collections</h2>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search collections..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {filteredCollections.map(col => {
                            const isSelected = selectedIds.includes(col.id);
                            return (
                                <div
                                    key={col.id}
                                    onClick={() => !isSelected && toggleCollection(col.id)}
                                    className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer ${isSelected
                                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">{col.title}</p>
                                        <p className="text-xs text-gray-500">{col.slug}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
