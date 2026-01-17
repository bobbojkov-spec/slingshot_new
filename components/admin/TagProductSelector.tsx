'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

type Product = {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    thumbnail_url: string | null;
    tags: string[];
};

type TagProductSelectorProps = {
    tagEn: string;
    onClose: () => void;
    onSave: () => void;
};

export default function TagProductSelector({ tagEn, onClose, onSave }: TagProductSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All Brands');
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/products/list').then(r => r.json()),
            fetch(`/api/admin/tags/products?tag=${encodeURIComponent(tagEn)}`).then(r => r.json())
        ]).then(([productsData, tagData]) => {
            setAllProducts(productsData.products || []);
            const currentTagProducts = tagData.products || [];
            setSelectedIds(new Set(currentTagProducts.map((p: Product) => p.id)));
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load products', err);
            setLoading(false);
        });
    }, [tagEn]);

    const brands = ['All Brands', ...Array.from(new Set(allProducts.map(p => p.brand || 'Slingshot').filter(Boolean)))].sort() as string[];

    const filteredProducts = allProducts.filter(product => {
        const productBrand = product.brand || 'Slingshot';
        const brandMatch = selectedBrand === 'All Brands' || productBrand === selectedBrand;
        if (!brandMatch) return false;

        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = product.name?.toLowerCase().includes(searchLower) || false;
        const tagMatch = product.tags?.some(tag => tag?.toLowerCase().includes(searchLower)) || false;

        return nameMatch || tagMatch;
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
            const res = await fetch('/api/admin/tags/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagEn, productIds: Array.from(selectedIds) })
            });
            if (!res.ok) throw new Error('Failed to save');
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
            <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-[1400px] h-[95%] max-h-[900px] flex flex-col overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Manage Tag Products: {tagEn}</h2>
                        <p className="text-sm text-gray-500 mt-1">Select products to associate with this tag</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Selection Summary */}
                    <div className="w-1/4 border-r p-4 overflow-y-auto bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Current Selection ({selectedIds.size})</h3>
                        <div className="space-y-2">
                            {allProducts.filter(p => selectedIds.has(p.id)).map(product => (
                                <div key={product.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                    <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                        {product.thumbnail_url ? (
                                            <img src={product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                        ) : <div className="w-full h-full flex items-center justify-center"><Search size={14} className="text-gray-300" /></div>}
                                    </div>
                                    <span className="text-xs font-medium text-gray-900 truncate flex-1">{product.name}</span>
                                    <button onClick={() => toggleProduct(product)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Catalog */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b bg-white flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
                            >
                                {brands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredProducts.map(product => {
                                    const isSelected = selectedIds.has(product.id);
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => toggleProduct(product)}
                                            className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                {product.thumbnail_url ? <img src={product.thumbnail_url} className="w-full h-full object-cover" /> : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{product.brand || 'Slingshot'}</p>
                                            </div>
                                            {isSelected && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-white flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600">
                        {selectedIds.size} products selected
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm">
                            {saving ? 'Saving...' : 'Save Tag Associations'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
