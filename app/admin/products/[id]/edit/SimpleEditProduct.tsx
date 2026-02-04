'use client';

import { useState, useCallback } from 'react';
import { Button, Input, message, Tabs } from 'antd';
import type { Product } from './EditProduct';

export default function SimpleEditProduct({
    product,
    categories,
    collections,
}: {
    product: Product;
    categories: { id: string; name: string }[];
    collections: { id: string; title: string }[];
}) {
    const [draft, setDraft] = useState<Product>(product);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    const updateField = useCallback((field: string, value: any) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/products/${draft.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draft),
            });
            if (!res.ok) throw new Error('Save failed');
            message.success('Saved');
        } catch (e: any) {
            message.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>Edit Product: {draft.info?.title || draft.name}</h1>
            <Button type="primary" loading={saving} onClick={handleSave} style={{ marginBottom: 16 }}>
                Save
            </Button>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.TabPane tab="Info" key="info">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                        <div>
                            <label>Title</label>
                            <Input
                                value={draft.info?.title || ''}
                                onChange={e => updateField('info', { ...draft.info, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Handle</label>
                            <Input
                                value={draft.info?.handle || ''}
                                onChange={e => updateField('info', { ...draft.info, handle: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Brand</label>
                            <Input
                                value={draft.info?.brand || ''}
                                onChange={e => updateField('info', { ...draft.info, brand: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Status</label>
                            <Input
                                value={draft.info?.status || ''}
                                onChange={e => updateField('info', { ...draft.info, status: e.target.value })}
                            />
                        </div>
                    </div>
                </Tabs.TabPane>

                <Tabs.TabPane tab={`Variants (${draft.variants?.length || 0})`} key="variants">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {draft.variants?.map((v: any) => (
                            <div key={v.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 4 }}>
                                <div><strong>{v.title}</strong></div>
                                <div>SKU: {v.sku}</div>
                                <div>Price: ${v.price}</div>
                                <div>Stock: {v.inventory_quantity}</div>
                                <div>Status: {v.status}</div>
                            </div>
                        ))}
                    </div>
                </Tabs.TabPane>

                <Tabs.TabPane tab={`Colors (${draft.product_colors?.length || 0})`} key="colors">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
                        {draft.product_colors?.map((c: any) => (
                            <div key={c.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 4 }}>
                                <img src={c.url} alt={c.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }} />
                                <Input
                                    size="small"
                                    value={c.name}
                                    onChange={e => {
                                        const newColors = draft.product_colors?.map((pc: any) =>
                                            pc.id === c.id ? { ...pc, name: e.target.value } : pc
                                        );
                                        updateField('product_colors', newColors);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
}
