'use client';

import { useState } from 'react';
import { Button, Card, Input, Modal, Space, Typography, message, Popconfirm, Image, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleFilled } from '@ant-design/icons';
import type { Product } from '../EditProduct';

export default function ColorsTab({
    draft,
    setDraft,
}: {
    draft: Product;
    setDraft: React.Dispatch<React.SetStateAction<Product>>;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

    const colors = draft.product_colors || [];
    const productImages = draft.images || [];

    const toggleSelection = (path: string) => {
        setSelectedPaths(prev =>
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    const handleBulkAdd = async () => {
        if (selectedPaths.length === 0) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${draft.id}/colors/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: selectedPaths
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Add with signed URLs from matching images
            const newColors = data.colors.map((c: any) => {
                const matchingImg = productImages.find(img => img.storage_path === c.image_path);
                return { ...c, url: matchingImg?.thumb_url || matchingImg?.medium_url || matchingImg?.url };
            });

            setDraft(prev => ({
                ...prev,
                product_colors: [...(prev.product_colors || []), ...newColors]
            }));

            message.success(`${selectedPaths.length} colors added`);
            setIsModalOpen(false);
            setSelectedPaths([]);
        } catch (e: any) {
            message.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async (colorId: string, name: string) => {
        setDraft(prev => ({
            ...prev,
            product_colors: prev.product_colors?.map(c => c.id === colorId ? { ...c, name } : c)
        }));

        try {
            await fetch(`/api/admin/products/${draft.id}/colors/${colorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteColor = async (colorId: string) => {
        try {
            await fetch(`/api/admin/products/${draft.id}/colors/${colorId}`, { method: 'DELETE' });
            setDraft(prev => ({
                ...prev,
                product_colors: prev.product_colors?.filter(c => c.id !== colorId),
                variants: prev.variants?.map(v => v.product_color_id === colorId ? { ...v, product_color_id: null } : v)
            }));
            message.success('Color deleted');
        } catch (e: any) {
            message.error(e.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card
                title="Visual Colors"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setSelectedPaths([]);
                            setIsModalOpen(true);
                        }}
                    >
                        Add Colors
                    </Button>
                }
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
                    {colors.map((color: any) => (
                        <div key={color.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, textAlign: 'center', background: 'white' }}>
                            <div style={{ width: '100%', aspectRatio: '1', marginBottom: 8, borderRadius: 4, overflow: 'hidden', background: '#f5f5f5' }}>
                                <img src={color.url || color.image_path} alt="color" style={{ width: '100%', height: '100%', objectFit: 'contain' }} title={color.image_path} />
                            </div>
                            <Input
                                size="small"
                                placeholder="Color Name"
                                value={color.name || ''}
                                onChange={(e) => handleUpdateName(color.id, e.target.value)}
                                style={{ marginBottom: 8 }}
                            />
                            <Popconfirm title="Delete this color?" onConfirm={() => handleDeleteColor(color.id)} okType="danger">
                                <Button type="text" danger icon={<DeleteOutlined />} size="small">Delete</Button>
                            </Popconfirm>
                        </div>
                    ))}
                    {colors.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#999' }}>
                            No colors defined. Click "Add Colors" to pick from gallery.
                        </div>
                    )}
                </div>
            </Card>

            <Modal
                title="Select Images for Visual Colors"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleBulkAdd}
                confirmLoading={loading}
                okText={`Add ${selectedPaths.length} Selected`}
                width={800}
            >
                <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                    <Button onClick={() => setSelectedPaths(productImages.map((img: any) => img.storage_path))}>
                        Select All
                    </Button>
                    <Button onClick={() => setSelectedPaths([])}>
                        Deselect All
                    </Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: 8, padding: '0 0 16px' }}>
                    {productImages.map((img: any) => {
                        const isSelected = selectedPaths.includes(img.storage_path);
                        return (
                            <div
                                key={img.id}
                                style={{
                                    cursor: 'pointer',
                                    border: isSelected ? '2px solid #1890ff' : '1px solid #eee',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                                onClick={() => toggleSelection(img.storage_path)}
                            >
                                <Image
                                    src={img.thumb_url || img.medium_url || img.url}
                                    preview={false}
                                    style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }}
                                />
                                {isSelected && (
                                    <div style={{ position: 'absolute', top: 2, right: 2, color: '#1890ff', fontSize: 16 }}>
                                        <CheckCircleFilled />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}
