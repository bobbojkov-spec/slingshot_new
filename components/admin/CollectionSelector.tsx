'use client';

import { useState, useEffect } from 'react';
import { X, Search, Layers } from 'lucide-react';

type Collection = {
    id: string;
    title: string;
    slug: string;
    source: string;
    signed_image_url?: string | null;
};

type CollectionSelectorProps = {
    parentId: string;
    onClose: () => void;
    onSave: () => void;
};

export default function CollectionSelector({ parentId, onClose, onSave }: CollectionSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch all collections and current child collections
    useEffect(() => {
        Promise.all([
            fetch('/api/admin/collections/search').then(r => r.json()),
            fetch(`/api/admin/collections/${parentId}/children`).then(r => r.json())
        ]).then(([searchData, childrenData]) => {
            // Filter out the parent itself from the list
            const others = (searchData.collections || []).filter((c: Collection) => c.id !== parentId);
            setAllCollections(others);
            setSelectedIds(new Set((childrenData.collections || []).map((c: Collection) => c.id)));
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load collections', err);
            setLoading(false);
        });
    }, [parentId]);

    const filteredCollections = allCollections.filter(c => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return c.title?.toLowerCase().includes(lower) || c.slug?.toLowerCase().includes(lower);
    });

    const toggleCollection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/collections/${parentId}/children`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionIds: Array.from(selectedIds) })
            });
            if (res.ok) {
                onSave();
                onClose();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save children:', error);
            alert('Failed to save children');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]">
                <div className="bg-white rounded p-8 shadow-2xl border border-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-900 font-medium">Loading collections...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Manage Nested Collections</h2>
                        <p className="text-sm text-gray-500 mt-2">Select collections to list under this meta-collection</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900">
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b bg-gray-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search collections..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredCollections.map(c => {
                            const isSelected = selectedIds.has(c.id);
                            return (
                                <div
                                    key={c.id}
                                    onClick={() => toggleCollection(c.id)}
                                    className={`flex items-center gap-4 p-3 rounded cursor-pointer transition-all border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                                        <Layers size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{c.title || 'Untitled'}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{c.source}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                        }`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-white flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                        {selectedIds.size} collections selected
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
