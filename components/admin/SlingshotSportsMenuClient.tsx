'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    GripVertical, 
    Pencil, 
    Trash2, 
    Plus, 
    ChevronDown, 
    ChevronUp,
    Link as LinkIcon,
    X,
    Check,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import Link from 'next/link';

// Types
interface Sport {
    key: string;
    label: string;
    labelBg: string;
    color: string;
    icon: string;
}

interface Collection {
    id: string;
    title: string;
    slug: string;
    source: string;
    product_count?: number;
    has_nested?: boolean;
    child_count?: number;
}

interface MenuGroup {
    id: string;
    title: string;
    title_bg?: string;
    slug?: string;
    source: string;
    sport?: string;
    sort_order: number;
    collection_count?: number;
    collections?: { id: string; sort_order: number }[];
}

interface Props {
    sports: Sport[];
    initialGroupsBySport: Record<string, MenuGroup[]>;
    availableCollections: Collection[];
}

export default function SlingshotSportsMenuClient({ 
    sports, 
    initialGroupsBySport, 
    availableCollections 
}: Props) {
    const router = useRouter();
    const [activeSport, setActiveSport] = useState<string>(sports[0].key);
    const [groupsBySport, setGroupsBySport] = useState(initialGroupsBySport);
    
    // Create group modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [newGroupTitleBg, setNewGroupTitleBg] = useState('');
    const [creating, setCreating] = useState(false);
    
    // Edit group modal state
    const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editTitleBg, setEditTitleBg] = useState('');
    const [editSortOrder, setEditSortOrder] = useState(0);
    const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    
    // Expand/collapse groups
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const currentGroups = groupsBySport[activeSport] || [];
    const unassignedGroups = groupsBySport['unassigned'] || [];

    const toggleGroupExpand = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupTitle.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/admin/menu-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newGroupTitle,
                    title_bg: newGroupTitleBg || null,
                    source: 'slingshot',
                    sport: activeSport,
                    sort_order: currentGroups.length
                })
            });

            if (!res.ok) throw new Error('Failed to create group');

            const { group } = await res.json();
            
            setGroupsBySport(prev => ({
                ...prev,
                [activeSport]: [...(prev[activeSport] || []), group]
            }));
            
            setNewGroupTitle('');
            setNewGroupTitleBg('');
            setShowCreateModal(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Are you sure? This will remove the group but NOT the collections inside it.')) return;

        try {
            const res = await fetch(`/api/admin/menu-groups/${groupId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            
            setGroupsBySport(prev => ({
                ...prev,
                [activeSport]: prev[activeSport].filter(g => g.id !== groupId)
            }));
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to delete group');
        }
    };

    const openEditModal = (group: MenuGroup) => {
        setEditingGroup(group);
        setEditTitle(group.title);
        setEditTitleBg(group.title_bg || '');
        setEditSortOrder(group.sort_order);
        setSelectedCollections(group.collections?.map(c => c.id) || []);
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroup) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/menu-groups/${editingGroup.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle,
                    title_bg: editTitleBg || null,
                    sort_order: editSortOrder,
                    collectionIds: selectedCollections
                })
            });

            if (!res.ok) throw new Error('Failed to update group');

            // Update local state
            setGroupsBySport(prev => ({
                ...prev,
                [activeSport]: prev[activeSport].map(g => 
                    g.id === editingGroup.id 
                        ? { 
                            ...g, 
                            title: editTitle, 
                            title_bg: editTitleBg,
                            sort_order: editSortOrder,
                            collection_count: selectedCollections.length,
                            collections: selectedCollections.map((id, idx) => ({ id, sort_order: idx }))
                        }
                        : g
                )
            }));

            setEditingGroup(null);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to update group');
        } finally {
            setSaving(false);
        }
    };

    const moveGroup = async (groupId: string, direction: 'up' | 'down') => {
        const groups = [...currentGroups];
        const index = groups.findIndex(g => g.id === groupId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= groups.length) return;

        // Swap in local state
        [groups[index], groups[newIndex]] = [groups[newIndex], groups[index]];
        
        // Update sort orders
        const updates = groups.map((g, idx) => ({ id: g.id, sort_order: idx }));
        
        setGroupsBySport(prev => ({ ...prev, [activeSport]: groups }));

        // Save to server
        try {
            await fetch('/api/admin/menu-groups/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            router.refresh();
        } catch (error) {
            console.error('Failed to reorder:', error);
        }
    };

    const toggleCollection = (collectionId: string) => {
        setSelectedCollections(prev => 
            prev.includes(collectionId) 
                ? prev.filter(id => id !== collectionId)
                : [...prev, collectionId]
        );
    };

    const moveCollection = (index: number, direction: 'up' | 'down') => {
        const newCollections = [...selectedCollections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newCollections.length) return;
        
        [newCollections[index], newCollections[newIndex]] = [newCollections[newIndex], newCollections[index]];
        setSelectedCollections(newCollections);
    };

    return (
        <div className="space-y-6">
            {/* Sport Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200">
                {sports.map((sport) => (
                    <button
                        key={sport.key}
                        onClick={() => setActiveSport(sport.key)}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                            activeSport === sport.key 
                                ? 'text-gray-900' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                        style={{ 
                            borderBottom: activeSport === sport.key ? `3px solid ${sport.color}` : 'none',
                            marginBottom: activeSport === sport.key ? '-1px' : '0'
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <span>{sport.icon}</span>
                            <span>{sport.label}</span>
                            <span className="text-xs text-gray-400">/ {sport.labelBg}</span>
                            <span 
                                className="ml-2 px-2 py-0.5 text-xs rounded-full text-white"
                                style={{ backgroundColor: sport.color }}
                            >
                                {(groupsBySport[sport.key] || []).length}
                            </span>
                        </span>
                    </button>
                ))}
            </div>

            {/* Active Sport Content */}
            <div className="space-y-6">
                {/* Sport Header */}
                <div 
                    className="p-4 rounded-lg text-white flex items-center justify-between"
                    style={{ backgroundColor: sports.find(s => s.key === activeSport)?.color || '#333' }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{sports.find(s => s.key === activeSport)?.icon}</span>
                        <div>
                            <h2 className="text-xl font-bold">
                                {sports.find(s => s.key === activeSport)?.label} Menu Groups
                            </h2>
                            <p className="text-white/80 text-sm">
                                Manage menu groups and collections for {sports.find(s => s.key === activeSport)?.label} sport
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Add Menu Group
                    </button>
                </div>

                {/* Menu Groups List */}
                <div className="space-y-4">
                    {currentGroups.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <div className="text-4xl mb-4">📂</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu groups yet</h3>
                            <p className="text-gray-500 mb-4">Create your first menu group for this sport</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Menu Group
                            </button>
                        </div>
                    ) : (
                        currentGroups.map((group, index) => (
                            <div 
                                key={group.id}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                            >
                                {/* Group Header */}
                                <div className="p-4 flex items-center gap-4">
                                    <div className="text-gray-300 cursor-grab">
                                        <GripVertical size={20} />
                                    </div>
                                    
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{group.title}</h3>
                                        {group.title_bg && (
                                            <p className="text-sm text-gray-500">{group.title_bg}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <LinkIcon size={14} />
                                        <span>{group.collection_count || 0} collections</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => moveGroup(group.id, 'up')}
                                            disabled={index === 0}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
                                            title="Move up"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => moveGroup(group.id, 'down')}
                                            disabled={index === currentGroups.length - 1}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
                                            title="Move down"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-gray-200 mx-1" />
                                        <button
                                            onClick={() => openEditModal(group)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit Group"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGroup(group.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete Group"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => toggleGroupExpand(group.id)}
                                            className="p-2 text-gray-500 hover:text-gray-700 rounded transition-colors"
                                            title={expandedGroups.has(group.id) ? "Collapse" : "Expand"}
                                        >
                                            {expandedGroups.has(group.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Collections */}
                                {expandedGroups.has(group.id) && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                                        {group.collections && group.collections.length > 0 ? (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 mb-3">Linked Collections:</p>
                                                {group.collections.map((coll, idx) => {
                                                    const collection = availableCollections.find(c => c.id === coll.id);
                                                    return collection ? (
                                                        <div
                                                            key={coll.id}
                                                            className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200"
                                                        >
                                                            <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                                                            <LinkIcon size={14} className="text-blue-500" />
                                                            <span className="flex-1 text-sm">{collection.title}</span>
                                                            {/* Product Count Badge */}
                                                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                                {collection.product_count} products
                                                            </span>
                                                            {/* Nesting Badge */}
                                                            {collection.has_nested && (
                                                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                                                    NESTING ({collection.child_count})
                                                                </span>
                                                            )}
                                                            <Link
                                                                href={`/admin/collections/${collection.id}`}
                                                                className="text-xs text-blue-600 hover:underline"
                                                            >
                                                                View
                                                            </Link>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No collections linked to this group</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Unassigned Groups Warning */}
                {unassignedGroups.length > 0 && (
                    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">⚠️ Unassigned Menu Groups</h4>
                        <p className="text-sm text-yellow-700 mb-3">
                            These groups don't have a sport assigned. Edit them to assign to a specific sport.
                        </p>
                        <div className="space-y-2">
                            {unassignedGroups.map(group => (
                                <div key={group.id} className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200">
                                    <span className="text-sm">{group.title}</span>
                                    <button
                                        onClick={() => openEditModal(group)}
                                        className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                    >
                                        Assign Sport
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Create Menu Group</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                                <input
                                    type="text"
                                    value={newGroupTitle}
                                    onChange={(e) => setNewGroupTitle(e.target.value)}
                                    placeholder="e.g., Kites, Boards, Bars..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Bulgarian)</label>
                                <input
                                    type="text"
                                    value={newGroupTitleBg}
                                    onChange={(e) => setNewGroupTitleBg(e.target.value)}
                                    placeholder="e.g., Кайтове, Дъски, Барове..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newGroupTitle.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {creating ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Menu Group</h3>
                            <button onClick={() => setEditingGroup(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateGroup} className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (English) *</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (Bulgarian)</label>
                                    <input
                                        type="text"
                                        value={editTitleBg}
                                        onChange={(e) => setEditTitleBg(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                                <input
                                    type="number"
                                    value={editSortOrder}
                                    onChange={(e) => setEditSortOrder(parseInt(e.target.value) || 0)}
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    min="0"
                                />
                            </div>

                            {/* Collections Selection */}
                            <div className="border-t border-gray-200 pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Linked Collections ({selectedCollections.length} selected)
                                </label>
                                
                                {/* Selected Collections with Reordering */}
                                {selectedCollections.length > 0 && (
                                    <div className="mb-4 space-y-2">
                                        <p className="text-xs text-gray-500">Drag to reorder or use arrows:</p>
                                        {selectedCollections.map((collId, index) => {
                                            const collection = availableCollections.find(c => c.id === collId);
                                            if (!collection) return null;
                                            return (
                                                <div
                                                    key={collId}
                                                    className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded"
                                                >
                                                    <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                                                    <span className="flex-1 text-sm">{collection.title}</span>
                                                    {/* Product Count Badge */}
                                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                        {collection.product_count} products
                                                    </span>
                                                    {/* Nesting Badge */}
                                                    {collection.has_nested && (
                                                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                                            NESTING
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveCollection(index, 'up')}
                                                            disabled={index === 0}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        >
                                                            <ArrowUp size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveCollection(index, 'down')}
                                                            disabled={index === selectedCollections.length - 1}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        >
                                                            <ArrowDown size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCollection(collId)}
                                                            className="p-1 text-red-400 hover:text-red-600 ml-2"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Available Collections */}
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                    {availableCollections
                                        .filter(c => !selectedCollections.includes(c.id) && (c.product_count || 0) > 0)
                                        .map(collection => (
                                            <button
                                                key={collection.id}
                                                type="button"
                                                onClick={() => toggleCollection(collection.id)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left"
                                            >
                                                <Plus size={16} className="text-gray-400 flex-shrink-0" />
                                                <span className="flex-1 text-sm">{collection.title}</span>
                                                {/* Product Count Badge */}
                                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                    {collection.product_count} products
                                                </span>
                                                {/* Nesting Badge */}
                                                {collection.has_nested && (
                                                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                                        NESTING ({collection.child_count})
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400">{collection.slug}</span>
                                            </button>
                                        ))}
                                    {availableCollections.filter(c => !selectedCollections.includes(c.id) && (c.product_count || 0) > 0).length === 0 && (
                                        <p className="p-4 text-sm text-gray-500 text-center">
                                            No more collections available
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setEditingGroup(null)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !editTitle.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
