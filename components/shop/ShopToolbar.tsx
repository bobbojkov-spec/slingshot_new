'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Search, ArrowUpDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FilterDropdown } from './FilterDropdown';

interface FacetItem {
    slug: string;
    name: string;
    count: string;
}

interface Facets {
    categories: FacetItem[];
    collections: FacetItem[];
    types: FacetItem[]; // Keep for legacy if needed or remove
    tags: FacetItem[];
    brands: FacetItem[];
}

interface ShopToolbarProps {
    facets: Facets;
    totalProducts: number;
    basePath?: string;
}

export function ShopToolbar({ facets, totalProducts, basePath = '/shop' }: ShopToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local state for Search
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    const updateFilterPlain = (key: string, value: string | null) => {
        // NAVIGATOR LOGIC: If on a collection page (basePath != /shop), changing Category should redirect to Shop
        if (basePath !== '/shop' && key === 'category' && value) {
            router.push(`/shop?category=${value}`);
            return;
        }

        // NAVIGATOR LOGIC: If on a collection page, changing Brand should redirect to Shop ? 
        // User said: "The brand should be already filtered because I'm coming from a collection".
        // He likely wants filtering WITHIN collection. But if he chooses "All Brands" or another one?
        // Let's keep Brand as FILTER (local).

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        if (value) params.set(key, value);
        else params.delete(key);

        // Clear sub-filters if category changes (on Shop page)
        if (key === 'category') {
            params.delete('collection');
            params.delete('type');
            params.delete('tag');
        }

        router.push(`${basePath}?${params.toString()}`);
    };

    const updateFilterMulti = (key: string, values: string[]) => {
        // NAVIGATOR LOGIC: Collection Switcher
        // If 'collection' filter is changed, and we are ON a collection page, we should probably switch to that collection?
        // But FilterDropdown supports MULTI select. 
        // IF the user selects ONE collection, we could jump to it?
        // BUT current UI is a multi-checkbox. 
        // If user wants to "Switch", they might click another one. 
        // If they click 2, what happens?

        // Simpler: Keep collection filter as filter query param for now, BUT if user selects a collection on Shop it filters.
        // On Collection page, if they select ANOTHER collection, it filters for products in BOTH? (Intersection).
        // User said "Why the hell I see all collections?".
        // Maybe we just keep standard behavior but ensure visual clarity?
        // User asked "If I start to filter the category ... the whole thing should disappear".

        // Let's implement Category Redirect behavior first (above).
        // For Collection: If on Collection Page, maybe we should NOT allow selecting other collections? 
        // OR allow it but it filters properly (intersection).

        // Wait, user said "I click collection guidebars... if I start filtering ... why I see all collections?".
        // If he filters Category -> Redirects to Shop (Done).
        // If he filters Collection -> It stays on page but adds ?collection=... query.
        // If he wants to Navigate, he should use the Menu.
        // But if he uses the Filter Dropdown, he filters.

        // Just keeping standard behavior for Collection filter for now, as "Switching" via a Multi-Select is ambiguous.
        // However, Category is Single Select, so redirection is clear.

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        params.delete(key);
        values.forEach(val => params.append(key, val));
        router.push(`${basePath}?${params.toString()}`);
    };


    const currentCategory = searchParams.get('category');
    const currentCollections = searchParams.getAll('collection');
    const currentTags = searchParams.getAll('tag');
    const currentBrand = searchParams.get('brand'); // Single select for brand

    const handleSearchKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // Reset all filters, only keep 'q'
            router.push(`${basePath}?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <div className="bg-white border-y border-gray-200 sticky top-20 z-30 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 py-4">

                {/* Full Toolbar Row */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">

                    {/* Left Side: Filters Group */}
                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">

                        {/* Category Selector (Single Select) */}
                        <div className="relative group border border-gray-300 rounded px-3 py-1 bg-white hover:border-black transition-colors min-w-[150px]">
                            <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Category</label>
                            <div className="flex items-center justify-between">
                                <select
                                    value={currentCategory || ''}
                                    onChange={(e) => updateFilterPlain('category', e.target.value)}
                                    className="appearance-none bg-transparent font-bold uppercase tracking-wider text-sm pr-6 focus:outline-none cursor-pointer w-full text-black"
                                >
                                    <option value="">All Categories</option>
                                    {facets.categories.map(cat => (
                                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                                <ArrowUpDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-3 bottom-2.5" />
                            </div>
                        </div>

                        {/* Brand Selector - HIDDEN per user request */}
                        {/* <div className="relative group border border-gray-300 rounded px-3 py-1 bg-white hover:border-black transition-colors min-w-[150px]">
                            <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Brand</label>
                            <div className="flex items-center justify-between">
                                <select
                                    value={currentBrand || ''}
                                    onChange={(e) => updateFilterPlain('brand', e.target.value)}
                                    className="appearance-none bg-transparent font-bold uppercase tracking-wider text-sm pr-6 focus:outline-none cursor-pointer w-full text-black"
                                >
                                    <option value="">All Brands</option>
                                    {facets.brands.map(brand => (
                                        <option key={brand.slug} value={brand.slug}>{brand.name}</option>
                                    ))}
                                </select>
                                <ArrowUpDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-3 bottom-2.5" />
                            </div>
                        </div> */}


                        {/* Collection (Multi Select) */}
                        <FilterDropdown
                            label="Collection"
                            options={facets.collections || []}
                            selectedValues={currentCollections}
                            onChange={(vals) => updateFilterMulti('collection', vals)}
                            disabled={!facets.collections || facets.collections.length === 0}
                        />

                        {/* Tags (Multi Select) */}
                        <FilterDropdown
                            label="Tags / Features"
                            options={facets.tags || []}
                            selectedValues={currentTags}
                            onChange={(vals) => updateFilterMulti('tag', vals)}
                            disabled={facets.tags?.length === 0}
                        />

                    </div>

                    {/* Right Side: Search (Count Removed) */}
                    <div className="flex items-center gap-4 w-full xl:w-auto mt-4 xl:mt-0">
                        {/* Search Input */}
                        <div className="relative flex-1 xl:w-64">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKey}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-black transition-colors bg-gray-50 uppercase tracking-wide font-medium placeholder:normal-case"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
