'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Search, ArrowUpDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { FilterDropdown } from './FilterDropdown';

interface FacetItem {
    slug: string;
    name: string;
    count: string;
}

interface Facets {
    categories: FacetItem[];
    types: FacetItem[];
    tags: FacetItem[];
    brands: FacetItem[];
}

interface ShopToolbarProps {
    facets: Facets;
    totalProducts: number;
}

export function ShopToolbar({ facets, totalProducts }: ShopToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local state for Search and Slider to prevent lag
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [priceRange, setPriceRange] = useState<[number, number]>([
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 5000
    ]);

    const updateFilterPlain = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        if (value) params.set(key, value);
        else params.delete(key);

        // Clear sub-filters if category changes
        if (key === 'category') {
            params.delete('type');
            params.delete('tag');
        }

        router.push(`/shop?${params.toString()}`);
    };

    const updateFilterMulti = (key: string, values: string[]) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');

        // Remove existing keys first
        params.delete(key);

        // Add new values
        values.forEach(val => params.append(key, val));

        router.push(`/shop?${params.toString()}`);
    };

    const handlePriceChange = (val: number[]) => {
        setPriceRange([val[0], val[1]]);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        params.set('minPrice', val[0].toString());
        params.set('maxPrice', val[1].toString());
        router.push(`/shop?${params.toString()}`);
    };

    const currentCategory = searchParams.get('category');
    const currentTypes = searchParams.getAll('type');
    const currentTags = searchParams.getAll('tag');
    const availability = searchParams.get('availability');

    const handleSearchKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // Reset all filters, only keep 'q'
            router.push(`/shop?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <div className="bg-white border-y border-gray-200 sticky top-20 z-30 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 py-4">

                {/* Full Toolbar Row */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">

                    {/* Left Side: Filters Group */}
                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">

                        {/* Sport/Category Selector (Single Select) */}
                        <div className="relative group border border-gray-300 rounded px-3 py-1 bg-white hover:border-black transition-colors min-w-[150px]">
                            <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Sport</label>
                            <div className="flex items-center justify-between">
                                <select
                                    value={currentCategory || ''}
                                    onChange={(e) => updateFilterPlain('category', e.target.value)}
                                    className="appearance-none bg-transparent font-bold uppercase tracking-wider text-sm pr-6 focus:outline-none cursor-pointer w-full text-black"
                                >
                                    <option value="">All Sports</option>
                                    {facets.categories.map(cat => (
                                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                                <ArrowUpDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-3 bottom-2.5" />
                            </div>
                        </div>



                        {/* Product Type (Multi Select) */}
                        <FilterDropdown
                            label="Product Type"
                            options={facets.types || []}
                            selectedValues={currentTypes}
                            onChange={(vals) => updateFilterMulti('type', vals)}
                            disabled={facets.types?.length === 0}
                        />

                        {/* Tags (Multi Select) */}
                        <FilterDropdown
                            label="Tags / Features"
                            options={facets.tags || []}
                            selectedValues={currentTags}
                            onChange={(vals) => updateFilterMulti('tag', vals)}
                            disabled={facets.tags?.length === 0}
                        />

                        {/* Price Slider */}
                        <div className="border border-gray-300 rounded px-4 py-1.5 bg-white hover:border-black transition-colors min-w-[200px] flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Price</span>
                                <span className="text-[10px] font-medium text-black">€{priceRange[0]} - €{priceRange[1]}</span>
                            </div>
                            <Slider
                                min={0}
                                max={5000}
                                step={50}
                                defaultValue={[priceRange[0], priceRange[1]]}
                                onAfterChange={handlePriceChange}
                            />
                        </div>



                    </div>

                    {/* Right Side: Search and Count */}
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

                        <div className="text-right hidden sm:block">
                            <span className="text-2xl font-black">{totalProducts}</span>
                            <span className="text-xs text-gray-500 uppercase font-bold block leading-none">Products</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
