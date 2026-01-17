'use client';

import { useState } from 'react';
import { Button, Card, Input, Modal, Space, Typography, message, Popconfirm, Image } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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
    const colors = draft.product_colors || [];

    // Group images for selection
    const productImages = draft.images || [];

    const handleCreateColor = async (imagePath: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${draft.id}/colors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_path: imagePath,
                    name: '',
                    display_order: colors.length,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // We need the full object including presigned url if possible, 
            // but for now let's just use the selected image's url from the list if available
            const selectedImg = productImages.find(img => img.storage_path === imagePath);

            setDraft(prev => ({
                ...prev,
                product_colors: [...(prev.product_colors || []), { ...data.color, url: selectedImg?.url }]
            }));
            message.success('Color added');
            setIsModalOpen(false);
        } catch (e: any) {
            message.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async (colorId: string, name: string) => {
        // Optimistic update
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
                // Also clear from variants
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
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Add Color</Button>}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
                    {colors.map((color: any) => (
                        <div key={color.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                            <div style={{ width: '100%', aspectRatio: '1', marginBottom: 8, borderRadius: 4, overflow: 'hidden', background: '#f5f5f5' }}>
                                {/* Provide visual fallback if URL missing (e.g. newly created before refresh) */}
                                <img src={color.url || color.image_path} alt="color" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <Input
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
                            No colors defined. Click "Add Color" to pick from images.
                        </div>
                    )}
                </div>
            </Card>

            <Modal
                title="Select Image for Color"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 16 }}>
                    {productImages.map((img: any) => (
                        <div
                            key={img.id}
                            style={{ cursor: 'pointer', border: '2px solid transparent', borderRadius: 4, overflow: 'hidden' }}
                            className="hover:border-blue-500"
                            onClick={() => handleCreateColor(img.storage_path)}
                        >
                            <Image src={img.url} preview={false} style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }} />
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
