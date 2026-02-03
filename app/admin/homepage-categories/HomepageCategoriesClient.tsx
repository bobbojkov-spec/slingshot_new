'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, ArrowRight, Check, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

type Collection = {
  id: string;
  title: string;
  slug: string;
  source: string;
  subtitle?: string;
};

type HomepageCategoriesClientProps = {
  allCollections: Collection[];
  initialSelectedIds: string[];
};

export default function HomepageCategoriesClient({
  allCollections,
  initialSelectedIds,
}: HomepageCategoriesClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'slingshot' | 'rideengine'>('all');
  const [saving, setSaving] = useState(false);

  const filteredCollections = allCollections.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'all' || c.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const getCollection = useCallback(
    (id: string) => allCollections.find((c) => c.id === id),
    [allCollections]
  );

  const toggleCollection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((cid) => cid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedIds.length - 1) return;

    const newIds = [...selectedIds];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setSelectedIds(newIds);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/homepage-collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionIds: selectedIds }),
      });

      if (!res.ok) throw new Error('Failed to save');
      router.refresh();
      alert('Saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const selectedCollections = selectedIds
    .map((id) => getCollection(id))
    .filter(Boolean) as Collection[];

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-700">
            Selected: <strong>{selectedIds.length}</strong> collections
          </span>
          {selectedIds.length > 8 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              First 8 will be displayed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Selected Collections */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center justify-between">
              Selected Collections
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                {selectedIds.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              First 8 will appear on homepage
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {selectedCollections.map((col, index) => (
              <div
                key={col.id}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${index < 8
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
              >
                <span className="text-blue-400 font-mono text-xs w-6 text-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {col.title}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="capitalize">{col.source}</span>
                    <span className="text-gray-300">|</span>
                    <span className="truncate">{col.slug}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-white rounded disabled:opacity-30 text-gray-500 hover:text-gray-700"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === selectedIds.length - 1}
                    className="p-1 hover:bg-white rounded disabled:opacity-30 text-gray-500 hover:text-gray-700"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => toggleCollection(col.id)}
                    className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="Remove"
                  >
                    <ArrowLeft className="rotate-180" size={16} />
                  </button>
                </div>
              </div>
            ))}
            {selectedIds.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <p>No collections selected.</p>
                <p className="text-xs mt-1">Choose from the list on the right.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Available Collections */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <h2 className="font-semibold text-gray-900">Available Collections</h2>

            {/* Source Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'slingshot', 'rideengine'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSourceFilter(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${sourceFilter === filter
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {filter === 'all'
                    ? 'All'
                    : filter === 'slingshot'
                      ? 'Slingshot'
                      : 'Ride Engine'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search collections..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredCollections.map((col) => {
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
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                      }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {col.title}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="capitalize">{col.source}</span>
                      <span className="text-gray-300">|</span>
                      <span className="truncate">{col.slug}</span>
                    </p>
                  </div>
                </div>
              );
            })}
            {filteredCollections.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No collections found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
