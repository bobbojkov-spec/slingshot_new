'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';

interface FacetItem {
    slug: string;
    name: string;
    count: string; // count is string from PG
}

interface Facets {
    categories: FacetItem[];
    types: FacetItem[];
}

interface ProductFiltersProps {
    facets: Facets;
}

export function ProductFilters({ facets }: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Helper to update URL params
    const updateFilter = (key: string, value: string | null, mode: 'set' | 'toggle' | 'append' = 'set') => {
        const params = new URLSearchParams(searchParams.toString());

        // Reset page on filter change
        if (key !== 'page') {
            params.set('page', '1');
        }

        if (mode === 'set') {
            if (value) params.set(key, value);
            else params.delete(key);
        } else if (mode === 'toggle') {
            const current = params.get(key);
            if (current === value) params.delete(key);
            else params.set(key, value!);
        } else if (mode === 'append') {
            // Handle array params (like types)
            const current = params.getAll(key);
            if (current.includes(value!)) {
                params.delete(key);
                current.filter(c => c !== value).forEach(c => params.append(key, c));
            } else {
                params.append(key, value!);
            }
        }

        // If changing category, clear types because types are category-specific
        if (key === 'category') {
            params.delete('type');
        }

        router.push(`/shop?${params.toString()}`);
    };

    const currentCategory = searchParams.get('category');
    const currentTypes = searchParams.getAll('type');
    const currentAvailability = searchParams.get('availability');

    return (
        <div className="space-y-8">
            {/* Categories (Sports) */}
            <div>
                <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Sport</h3>
                <ul className="space-y-2">
                    {facets.categories.map((cat) => (
                        <li key={cat.slug}>
                            <button
                                onClick={() => updateFilter('category', cat.slug === currentCategory ? null : cat.slug, 'toggle')}
                                className={`flex items-center justify-between w-full text-left hover:text-black transition-colors ${currentCategory === cat.slug ? 'text-black font-bold' : 'text-gray-500'
                                    }`}
                            >
                                <span>{cat.name}</span>
                                {/* <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{cat.count}</span> */}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Product Types (Dynamic) */}
            {facets.types.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Product Type</h3>
                    <ul className="space-y-2">
                        {facets.types.map((type) => {
                            const isActive = currentTypes.includes(type.slug);
                            return (
                                <li key={type.slug}>
                                    <button
                                        onClick={() => updateFilter('type', type.slug, 'append')}
                                        className="flex items-center group w-full text-left"
                                    >
                                        <div className={`w-4 h-4 border mr-3 flex items-center justify-center transition-colors ${isActive ? 'bg-black border-black text-white' : 'border-gray-300 group-hover:border-gray-500'
                                            }`}>
                                            {isActive && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className={`${isActive ? 'text-black font-medium' : 'text-gray-500'} group-hover:text-black transition-colors`}>
                                            {type.name}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Availability */}
            <div>
                <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Availability</h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => updateFilter('availability', currentAvailability === 'in_stock' ? null : 'in_stock', 'toggle')}
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${currentAvailability === 'in_stock' ? 'bg-black' : 'bg-gray-200'
                            }`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${currentAvailability === 'in_stock' ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                    </button>
                    <span className="text-sm font-medium">In Stock Only</span>
                </div>
            </div>
        </div>
    );
}
