'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Search, ArrowUpDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FilterDropdown } from './FilterDropdown';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { buildLocalePath } from '@/lib/i18n/locale-links';

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
    const { language, t } = useLanguage();

    const tagOptions = (facets.tags || []).map(tag => ({
        ...tag,
        slug: tag.slug || tag.name
    }));

    // Local state for Search
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    const updateFilterPlain = (key: string, value: string | null) => {
        // NAVIGATOR LOGIC: If on a collection page (basePath != /shop), changing Category should redirect to Shop
        if (basePath !== '/shop' && key === 'category' && value) {
            router.push(buildLocalePath(`/shop?category=${value}`, language));
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

        router.push(buildLocalePath(`${basePath}?${params.toString()}`, language));
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
        router.push(buildLocalePath(`${basePath}?${params.toString()}`, language));
    };


    const currentCategory = searchParams.get('category');
    const currentCollections = searchParams.getAll('collection');
    const currentTags = searchParams.getAll('tag');
    const currentBrand = searchParams.get('brand'); // Single select for brand

    const handleSearchKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // Global Search - Always redirect to Shop with query, resetting other context
            // User requested: "KEYword search is Always GLOBAL. not a filter."
            router.push(buildLocalePath(`/shop?q=${encodeURIComponent(searchTerm)}`, language));
        }
    };

    return (
        <div className="bg-zinc-100 border-y border-gray-200 sticky top-20 z-30 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 py-4">

                {/* Full Toolbar Row */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">

                    {/* Left Side: Filters Group */}
                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">

                        {/* Brand (Multi Select) */}
                        <FilterDropdown
                            label={language === 'bg' ? 'Марка' : 'Brand'}
                            options={facets.brands || []}
                            selectedValues={searchParams.getAll('brand')}
                            onChange={(vals) => updateFilterMulti('brand', vals)}
                            disabled={!facets.brands || facets.brands.length === 0}
                        />

                        {/* Collection (Multi Select) */}
                        <FilterDropdown
                            label={language === 'bg' ? 'Колекция' : 'Collection'}
                            options={facets.collections || []}
                            selectedValues={currentCollections}
                            onChange={(vals) => updateFilterMulti('collection', vals)}
                            disabled={!facets.collections || facets.collections.length === 0}
                        />

                        {/* Tags (Multi Select) */}
                        <FilterDropdown
                            label={language === 'bg' ? 'Тагове / Характеристики' : 'Tags / Features'}
                            options={tagOptions}
                            selectedValues={currentTags}
                            onChange={(vals) => updateFilterMulti('tag', vals)}
                            disabled={!tagOptions || tagOptions.length === 0}
                        />

                    </div>

                    {/* Right Side: Product Count */}
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide shrink-0">
                        {language === 'bg' ? 'Продукти' : 'Products'}:{' '}
                        <span className="text-black font-bold">{totalProducts}</span>
                    </div>

                </div>
            </div>
        </div>
    );
}
