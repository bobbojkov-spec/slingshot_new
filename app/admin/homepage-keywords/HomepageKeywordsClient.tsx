'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Check, ArrowUp, ArrowDown } from 'lucide-react';

type Tag = {
  name_en: string;
  name_bg: string | null;
  slug: string;
  count: number;
};

type HomepageKeywordsClientProps = {
  allTags: Tag[];
  initialSelectedNames: string[];
};

export default function HomepageKeywordsClient({
  allTags,
  initialSelectedNames,
}: HomepageKeywordsClientProps) {
  const router = useRouter();
  const [selectedNames, setSelectedNames] = useState<string[]>(initialSelectedNames);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredTags = allTags.filter(
    (t) =>
      t.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.name_bg && t.name_bg.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTag = useCallback(
    (name: string) => allTags.find((t) => t.name_en === name),
    [allTags]
  );

  const toggleTag = (name: string) => {
    if (selectedNames.includes(name)) {
      setSelectedNames(selectedNames.filter((n) => n !== name));
    } else {
      setSelectedNames([...selectedNames, name]);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedNames.length - 1) return;

    const newNames = [...selectedNames];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newNames[index], newNames[newIndex]] = [newNames[newIndex], newNames[index]];
    setSelectedNames(newNames);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/homepage-keywords', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagNames: selectedNames }),
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

  const selectedTags = selectedNames
    .map((name) => getTag(name))
    .filter(Boolean) as Tag[];

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-purple-700">
            Selected: <strong>{selectedNames.length}</strong> keywords
          </span>
          {selectedNames.length > 20 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-4 py-2 rounded">
              Max 20 will be displayed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gray-900 text-white font-medium rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Selected Keywords */}
        <div className="bg-white border border-gray-200 rounded shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-medium text-gray-900 flex items-center justify-between">
              Selected Keywords
              <span className="bg-purple-100 text-purple-700 text-xs px-4 py-2 rounded-full">
                {selectedNames.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-2">
              Max 20. Order is preserved but displayed randomly.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {selectedTags.map((tag, index) => (
              <div
                key={tag.name_en}
                className={`flex items-center gap-2 p-4 rounded border transition-colors ${index < 16
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
              >
                <span className="text-purple-400 font-mono text-xs w-6 text-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {tag.name_en}
                  </p>
                  {tag.name_bg && (
                    <p className="text-xs text-gray-500 truncate">{tag.name_bg}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {tag.count} products
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-white rounded disabled:opacity-30 text-gray-500 hover:text-gray-700"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === selectedNames.length - 1}
                    className="p-2 hover:bg-white rounded disabled:opacity-30 text-gray-500 hover:text-gray-700"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => toggleTag(tag.name_en)}
                    className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="Remove"
                  >
                    <ArrowLeft className="rotate-180" size={16} />
                  </button>
                </div>
              </div>
            ))}
            {selectedNames.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <p>No keywords selected.</p>
                <p className="text-xs mt-2">Choose from the list on the right.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Available Tags */}
        <div className="bg-white border border-gray-200 rounded shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 space-y-4">
            <h2 className="font-medium text-gray-900">Available Keywords</h2>

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
                placeholder="Search keywords..."
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredTags.map((tag) => {
              const isSelected = selectedNames.includes(tag.name_en);
              return (
                <div
                  key={tag.name_en}
                  onClick={() => !isSelected && toggleTag(tag.name_en)}
                  className={`flex items-center gap-4 p-4 border rounded transition-all cursor-pointer ${isSelected
                    ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    }`}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-gray-300'
                      }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {tag.name_en}
                    </p>
                    {tag.name_bg && (
                      <p className="text-xs text-gray-500 truncate">
                        {tag.name_bg}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {tag.count} products
                  </span>
                </div>
              );
            })}
            {filteredTags.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No keywords found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
