
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FilterOption {
    slug: string;
    name: string;
    count?: string | number;
}

interface FilterDropdownProps {
    label: string;
    options: FilterOption[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    disabled?: boolean;
}

export function FilterDropdown({ label, options, selectedValues, onChange, disabled }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (slug: string) => {
        if (selectedValues.includes(slug)) {
            onChange(selectedValues.filter(v => v !== slug));
        } else {
            onChange([...selectedValues, slug]);
        }
    };

    return (
        <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between min-w-[150px] px-3 py-2 
                    bg-white border rounded text-left transition-colors
                    ${isOpen ? 'border-black ring-1 ring-black' : 'border-gray-300 hover:border-black'}
                `}
            >
                <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">
                        {label}
                    </span>
                    <span className="block text-sm font-medium text-black truncate max-w-[140px]">
                        {selectedValues.length === 0
                            ? 'All'
                            : selectedValues.length === 1
                                ? options.find(o => o.slug === selectedValues[0])?.name || selectedValues[0]
                                : `${selectedValues.length} Selected`
                        }
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg z-50 p-2">
                    {options.length === 0 ? (
                        <div className="text-sm text-gray-400 px-2 py-1">No options</div>
                    ) : (
                        options.map((option) => {
                            const isSelected = selectedValues.includes(option.slug);
                            return (
                                <button
                                    key={option.slug}
                                    type="button"
                                    onClick={() => toggleOption(option.slug)}
                                    className="flex items-center w-full px-2 py-2 text-sm text-left hover:bg-gray-50 rounded transition-colors group"
                                >
                                    <div className={`
                                        w-4 h-4 mr-3 border rounded flex items-center justify-center transition-colors
                                        ${isSelected ? 'bg-black border-black' : 'border-gray-300 group-hover:border-black'}
                                    `}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="flex-1 font-medium text-gray-700 group-hover:text-black">
                                        {option.name}
                                    </span>
                                    {option.count !== undefined && (
                                        <span className="text-xs text-gray-400 font-mono ml-2">
                                            {option.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
