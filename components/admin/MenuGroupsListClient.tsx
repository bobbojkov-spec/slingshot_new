'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

type MenuGroup = {
    id: string;
    title: string;
    source: string;
    sort_order: number;
    collection_count?: number;
};

type MenuGroupsListClientProps = {
    initialGroups: MenuGroup[];
    source: string; // 'slingshot' or 'rideengine'
};

export default function MenuGroupsListClient({ initialGroups, source }: MenuGroupsListClientProps) {
    const router = useRouter();
    const [groups, setGroups] = useState(initialGroups);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/admin/menu-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    source,
                    sort_order: groups.length // append to end
                })
            });

            if (!res.ok) throw new Error('Failed to create group');

            const { group } = await res.json();
            setGroups([...groups, group]);
            setNewTitle('');
            router.refresh(); // Refresh server components
        } catch (error) {
            console.error(error);
            alert('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will remove the group but NOT the collections inside it.')) return;

        try {
            const res = await fetch(`/api/admin/menu-groups/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setGroups(groups.filter(g => g.id !== id));
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to delete group');
        }
    };

    return (
        <div className="space-y-8">
            {/* Create New Group Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Create New Menu Group</h3>
                <form onSubmit={handleCreate} className="flex gap-4">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Gear, Accessories, Apparel..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={creating || !newTitle.trim()}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                        Create Group
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="space-y-4">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors group"
                    >
                        {/* Drag Handle (Visual only for now) */}
                        <div className="text-gray-300 cursor-grab active:cursor-grabbing">
                            <GripVertical size={20} />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{group.title}</h3>
                            <p className="text-sm text-gray-500">
                                Contains {group.collection_count || 0} collections
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={`/admin/collections-${source}/groups/${group.id}`}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Group"
                            >
                                <Pencil size={18} />
                            </Link>
                            <button
                                onClick={() => handleDelete(group.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Group"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {groups.length === 0 && (
                    <div className="text-center py-12 text-gray-400 italic">
                        No menu groups found. Create one above!
                    </div>
                )}
            </div>
        </div>
    );
}
