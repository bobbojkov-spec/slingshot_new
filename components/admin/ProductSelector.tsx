'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import Image from 'next/image';

type Product = {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    thumbnail_url: string | null;
    tags: string[];
};

type ProductSelectorProps = {
    collectionId: string;
    onClose: () => void;
    onSave: () => void;
};

export default function ProductSelector({ collectionId, onClose, onSave }: ProductSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All Brands');
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch all products and current collection products
    useEffect(() => {
        Promise.all([
            fetch('/api/admin/products/list').then(r => r.json()),
            fetch(`/api/admin/collections/${collectionId}/products`).then(r => r.json())
        ]).then(([productsData, collectionData]) => {
            setAllProducts(productsData.products || []);
            setSelectedProducts(collectionData.products || []);
            setSelectedIds(new Set((collectionData.products || []).map((p: Product) => p.id)));
            setLoading(false);
        });
    }, [collectionId]);

    // Get unique brands
    const brands = ['All Brands', ...Array.from(new Set(allProducts.map(p => p.brand || 'Slingshot').filter(Boolean)))].sort() as string[];

    // Filter products by brand and search term (name and tags)
    const filteredProducts = allProducts.filter(product => {
        const productBrand = product.brand || 'Slingshot';
        const brandMatch = selectedBrand === 'All Brands' || productBrand === selectedBrand;
        if (!brandMatch) return false;

        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = product.name?.toLowerCase().includes(searchLower) || false;
        const tagMatch = product.tags?.some(tag => tag?.toLowerCase().includes(searchLower)) || false;
        const brandStrMatch = productBrand.toLowerCase().includes(searchLower) || false;

        return nameMatch || tagMatch || brandStrMatch;
    });

    const toggleProduct = (product: Product) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(product.id)) {
            newSelected.delete(product.id);
        } else {
            newSelected.add(product.id);
        }
        setSelectedIds(newSelected);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/admin/collections/${collectionId}/products`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds: Array.from(selectedIds) })
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to save products:', error);
            alert('Failed to save products');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]">
                <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-900 font-semibold">Loading catalog...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-[1600px] h-[95%] max-h-[1000px] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-white relative z-20">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Manage Collection Products</h2>
                        <p className="text-sm text-gray-500 mt-1">Select products to include in this collection</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Selected Products */}
                    <div className="w-1/3 border-r p-4 overflow-y-auto bg-gray-50/50">
                        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                            In Collection
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-sm">
                                {selectedIds.size}
                            </span>
                        </h3>
                        <div className="space-y-2">
                            {allProducts
                                .filter(p => selectedIds.has(p.id))
                                .map(product => (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-3 p-2 bg-white border border-blue-100 rounded-lg shadow-sm"
                                    >
                                        <div className="relative w-10 h-10 flex-shrink-0 rounded border border-gray-100 overflow-hidden bg-gray-50">
                                            {product.thumbnail_url ? (
                                                <img
                                                    src={product.thumbnail_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Search size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                                            <p className="text-[10px] text-gray-500">{product.brand || 'Slingshot'}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleProduct(product)}
                                            className="text-gray-400 hover:text-red-600 p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            {selectedIds.size === 0 && (
                                <div className="text-center py-12">
                                    <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Search className="text-gray-400" size={20} />
                                    </div>
                                    <p className="text-gray-400 text-sm italic">No products selected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: All Products with Search & Filter */}
                    <div className="flex-1 flex flex-col">
                        {/* Search & Filter Bar */}
                        <div className="p-6 border-b bg-white sticky top-0 z-10">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name, tags, or brand..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="w-48">
                                    <select
                                        value={selectedBrand}
                                        onChange={(e) => setSelectedBrand(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
                                    >
                                        {brands.map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Showing {filteredProducts.length} of {allProducts.length} products
                            </p>
                        </div>

                        {/* Product List */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredProducts.map(product => {
                                    const isSelected = selectedIds.has(product.id);
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => toggleProduct(product)}
                                            className={`flex flex-col p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg border border-gray-100 overflow-hidden bg-gray-100">
                                                    {product.thumbnail_url ? (
                                                        <img
                                                            src={product.thumbnail_url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <Search size={24} />
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                                                            <div className="bg-blue-600 text-white rounded-full p-1">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                                                        {product.name || 'Unnamed Product'}
                                                    </p>
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1 block">
                                                        {product.brand || 'Slingshot'}
                                                    </span>
                                                </div>
                                            </div>

                                            {product.tags && product.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-auto">
                                                    {product.tags.slice(0, 2).map((tag, i) => (
                                                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {product.tags.length > 2 && (
                                                        <span className="text-[9px] text-gray-400">+{product.tags.length - 2}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="bg-white w-16 h-16 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <Search className="text-gray-300" size={32} />
                                    </div>
                                    <h4 className="text-gray-900 font-medium">No results found</h4>
                                    <p className="text-gray-500 text-sm mt-1">Try adjusting your search or brand filter</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-white">
                    <div>
                        <span className="text-sm text-gray-500">Selected Products</span>
                        <p className="text-lg font-bold text-gray-900 leading-none mt-1">
                            {selectedIds.size} <span className="text-sm font-normal text-gray-500">items</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </div>
                            ) : (
                                'Save Collection'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
